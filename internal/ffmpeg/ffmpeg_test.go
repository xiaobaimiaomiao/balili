package ffmpeg

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

// resolveTestFFmpeg lets the integration test run when ffmpeg isn't in PATH
// or next to the test binary by honoring FFMPEG_TEST_BIN.
func resolveTestFFmpeg(t *testing.T) string {
	if p := os.Getenv("FFMPEG_TEST_BIN"); p != "" {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	if _, err := exec.LookPath("ffmpeg"); err == nil {
		return "ffmpeg"
	}
	if _, err := exec.LookPath("ffmpeg.exe"); err == nil {
		return "ffmpeg.exe"
	}
	if exe, err := os.Executable(); err == nil {
		// test binary is in a temp dir, but the user's server.exe sits next to
		// ffmpeg.exe at the project root.  Walk up to find it.
		dir := filepath.Dir(exe)
		for i := 0; i < 6; i++ {
			cand := filepath.Join(dir, "ffmpeg.exe")
			if _, err := os.Stat(cand); err == nil {
				return cand
			}
			parent := filepath.Dir(dir)
			if parent == dir {
				break
			}
			dir = parent
		}
	}
	t.Skip("ffmpeg not found; set FFMPEG_TEST_BIN to point at ffmpeg/ffmpeg.exe to run this test")
	return ""
}

func TestGenerateIntegration(t *testing.T) {
	ffmpegPath := resolveTestFFmpeg(t)

	tmp, err := os.MkdirTemp("", "ffmpeg-test-*")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmp)

	videoPath := filepath.Join(tmp, "input.mp4")
	cmd := exec.Command(ffmpegPath,
		"-y", "-f", "lavfi", "-i", "testsrc=duration=6:size=320x240:rate=15",
		"-c:v", "libx264", "-pix_fmt", "yuv420p",
		videoPath,
	)
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("synthetic video: %v\n%s", err, out)
	}

	posterDir := filepath.Join(tmp, "posters")
	ssDir := filepath.Join(tmp, "screenshots")
	res, err := Generate(ffmpegPath, videoPath, "test123", posterDir, ssDir, "/uploads",
		ScreenshotCount(5), ScreenshotWidth(320), JPEGQuality(5),
	)
	if err != nil {
		t.Fatalf("Generate: %v", err)
	}
	if res == nil {
		t.Fatal("expected non-nil result")
	}
	if _, err := os.Stat(res.CoverPath); err != nil {
		t.Fatalf("cover not created at %s: %v", res.CoverPath, err)
	}
	if len(res.Screenshots) != 5 {
		t.Fatalf("expected 5 screenshots, got %d", len(res.Screenshots))
	}
	for i, p := range res.Screenshots {
		if _, err := os.Stat(p); err != nil {
			t.Fatalf("screenshot %d missing at %s: %v", i, p, err)
		}
	}
	if res.PublicCover != "/uploads/posters/test123.jpg" {
		t.Errorf("unexpected public cover: %q", res.PublicCover)
	}
	if len(res.PublicShots) != 5 {
		t.Errorf("expected 5 public shots, got %d", len(res.PublicShots))
	}
}
