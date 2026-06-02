// Package ffmpeg wraps the ffmpeg/ffprobe binaries to extract a cover image
// and a fixed set of preview screenshots from a video file.
//
// The helpers in this package are best-effort: if ffmpeg is missing or the
// video can't be probed, Generate returns empty results and a nil error so
// that callers can still persist the upload without thumbnails.
package ffmpeg

import (
	"bytes"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"sync"
)

// FindExecutable locates the ffmpeg binary.
//
// Windows: prefer ffmpeg.exe in the same directory as the running executable
// (where the user dropped it next to server.exe), then ./ffmpeg.exe relative
// to the current working directory, then PATH. Other platforms rely on PATH.
func FindExecutable() (string, error) {
	if runtime.GOOS == "windows" {
		candidates := []string{}
		if exe, err := os.Executable(); err == nil {
			candidates = append(candidates, filepath.Join(filepath.Dir(exe), "ffmpeg.exe"))
		}
		if cwd, err := os.Getwd(); err == nil {
			candidates = append(candidates, filepath.Join(cwd, "ffmpeg.exe"))
		}
		if path, err := exec.LookPath("ffmpeg.exe"); err == nil {
			candidates = append(candidates, path)
		}
		for _, c := range candidates {
			if _, err := os.Stat(c); err == nil {
				return c, nil
			}
		}
		return "", errors.New("ffmpeg.exe not found (place it next to server.exe or in PATH)")
	}
	if path, err := exec.LookPath("ffmpeg"); err == nil {
		return path, nil
	}
	return "", errors.New("ffmpeg not found in PATH")
}

// ProbeDurationSeconds returns the duration of the given video in seconds.
// It tries ffprobe first (no extra dep) and falls back to parsing the
// ffmpeg -i stderr banner.
func ProbeDurationSeconds(ffmpeg, videoPath string) (float64, error) {
	if path, err := exec.LookPath("ffprobe"); err == nil {
		out, err := exec.Command(path,
			"-v", "error",
			"-show_entries", "format=duration",
			"-of", "default=noprint_wrappers=1:nokey=1",
			videoPath,
		).Output()
		if err == nil {
			if s := strings.TrimSpace(string(out)); s != "" && s != "N/A" {
				if d, perr := strconv.ParseFloat(s, 64); perr == nil && d > 0 {
					return d, nil
				}
			}
		}
	}
	cmd := exec.Command(ffmpeg, "-i", videoPath)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	_ = cmd.Run()
	re := regexp.MustCompile(`Duration:\s*(\d+):(\d+):(\d+\.?\d*)`)
	m := re.FindStringSubmatch(stderr.String())
	if len(m) != 4 {
		return 0, fmt.Errorf("could not parse duration from ffmpeg output")
	}
	h, _ := strconv.ParseFloat(m[1], 64)
	min, _ := strconv.ParseFloat(m[2], 64)
	s, _ := strconv.ParseFloat(m[3], 64)
	d := h*3600 + min*60 + s
	if d <= 0 {
		return 0, errors.New("non-positive duration")
	}
	return d, nil
}

type Thumbnails struct {
	CoverPath    string
	PublicCover  string
	Screenshots  []string
	PublicShots  []string
}

type options struct {
	coverAt      func(duration float64) float64
	screenshotAt func(duration float64) []float64
	screenshotW int
	jpegQuality  int
}

// Option configures Generate.
type Option func(*options)

// ScreenshotCount overrides how many preview screenshots are extracted
// (default 5).
func ScreenshotCount(n int) Option {
	return func(o *options) { o.screenshotAt = defaultScreenshotTimes(n) }
}

// ScreenshotWidth overrides the JPEG width for screenshots (default 640).
// Height is auto-scaled.
func ScreenshotWidth(w int) Option {
	return func(o *options) { o.screenshotW = w }
}

// JPEGQuality sets the ffmpeg -q:v value (1-31, lower is better, default 3).
func JPEGQuality(q int) Option {
	return func(o *options) { o.jpegQuality = q }
}

// Generate extracts a cover image and 5 preview screenshots from videoPath.
// It writes files into posterDir / screenshotDir (both must be writable).
// The returned PublicCover / PublicShots are URL paths relative to the
// /uploads/ static mount, derived from the same directories.
//
// If ffmpeg is missing or the video cannot be probed the function returns
// (nil, nil) so the upload can still complete.
func Generate(ffmpeg, videoPath, videoID, posterDir, screenshotDir, publicPrefix string, opts ...Option) (*Thumbnails, error) {
	o := &options{
		coverAt:      defaultCoverTime,
		screenshotAt: defaultScreenshotTimes(5),
		screenshotW:  640,
		jpegQuality:  3,
	}
	for _, opt := range opts {
		opt(o)
	}

	if _, err := os.Stat(ffmpeg); err != nil {
		return nil, nil
	}
	if _, err := os.Stat(videoPath); err != nil {
		return nil, err
	}

	duration, err := ProbeDurationSeconds(ffmpeg, videoPath)
	if err != nil || duration <= 0 {
		return nil, nil
	}

	if err := os.MkdirAll(posterDir, 0o755); err != nil {
		return nil, err
	}
	if err := os.MkdirAll(screenshotDir, 0o755); err != nil {
		return nil, err
	}

	coverFile := videoID + ".jpg"
	coverAbs, err := safeJoin(posterDir, coverFile)
	if err != nil {
		return nil, err
	}
	if err := extractFrame(ffmpeg, videoPath, coverAbs, o.coverAt(duration), 0, o.jpegQuality); err != nil {
		// fall back to first frame
		_ = extractFrame(ffmpeg, videoPath, coverAbs, 0, 0, o.jpegQuality)
	}

	result := &Thumbnails{
		CoverPath:   coverAbs,
		PublicCover: strings.TrimRight(publicPrefix, "/") + "/posters/" + coverFile,
	}

	times := o.screenshotAt(duration)
	if len(times) > 0 {
		result.Screenshots, result.PublicShots = extractShots(ffmpeg, videoPath, videoID, screenshotDir, publicPrefix, times, o)
	}

	return result, nil
}

func extractShots(ffmpeg, videoPath, videoID, dir, publicPrefix string, times []float64, o *options) ([]string, []string) {
	type item struct {
		abs  string
		path string
	}
	items := make([]item, len(times))
	var wg sync.WaitGroup
	var mu sync.Mutex
	var failures int

	for i, t := range times {
		name := fmt.Sprintf("%s_%d.jpg", videoID, i)
		abs, err := safeJoin(dir, name)
		if err != nil {
			failures++
			continue
		}
		items[i] = item{
			abs:  abs,
			path: strings.TrimRight(publicPrefix, "/") + "/screenshots/" + name,
		}
		wg.Add(1)
		go func(idx int, abs string, at float64) {
			defer wg.Done()
			if err := extractFrame(ffmpeg, videoPath, abs, at, o.screenshotW, o.jpegQuality); err != nil {
				mu.Lock()
				failures++
				mu.Unlock()
			}
		}(i, abs, t)
	}
	wg.Wait()

	absOut := make([]string, 0, len(items))
	pubOut := make([]string, 0, len(items))
	for _, it := range items {
		if it.abs == "" {
			continue
		}
		if _, err := os.Stat(it.abs); err == nil {
			absOut = append(absOut, it.abs)
			pubOut = append(pubOut, it.path)
		}
	}
	return absOut, pubOut
}

func extractFrame(ffmpeg, videoPath, dst string, atSeconds float64, width, quality int) error {
	args := []string{"-y", "-ss", fmt.Sprintf("%.3f", atSeconds), "-i", videoPath, "-frames:v", "1", "-q:v", strconv.Itoa(quality)}
	if width > 0 {
		args = append(args, "-vf", fmt.Sprintf("scale=%d:-1", width))
	}
	args = append(args, dst)
	cmd := exec.Command(ffmpeg, args...)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("ffmpeg extract: %w (%s)", err, strings.TrimSpace(stderr.String()))
	}
	return nil
}

func defaultCoverTime(d float64) float64 {
	t := 1.0
	if d*0.05 > t {
		t = d * 0.05
	}
	if t >= d {
		t = d / 2
	}
	return t
}

func defaultScreenshotTimes(n int) func(d float64) []float64 {
	if n < 1 {
		n = 5
	}
	percentages := make([]float64, n)
	for i := 0; i < n; i++ {
		// 0.10, 0.28, 0.46, 0.64, 0.82, 0.96...
		percentages[i] = 0.10 + (0.90 * float64(i) / float64(n))
	}
	return func(d float64) []float64 {
		out := make([]float64, n)
		for i, p := range percentages {
			t := d * p
			if t < 0.1 {
				t = 0.1
			}
			if t >= d {
				t = d * 0.5
			}
			out[i] = t
		}
		return out
	}
}

func safeJoin(root, name string) (string, error) {
	absRoot, err := filepath.Abs(root)
	if err != nil {
		return "", err
	}
	absDst, err := filepath.Abs(filepath.Join(absRoot, filepath.Base(name)))
	if err != nil {
		return "", err
	}
	rel, err := filepath.Rel(absRoot, absDst)
	if err != nil {
		return "", err
	}
	if rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		return "", errors.New("path traversal detected")
	}
	return absDst, nil
}
