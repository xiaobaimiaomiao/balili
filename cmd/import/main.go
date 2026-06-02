package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"balili/internal/database"
	"balili/internal/model"

	"gorm.io/gorm/clause"
)

type jsonVideo struct {
	Title           string `json:"title"`
	VideoID         string `json:"videoId"`
	PosterImage     string `json:"posterImage"`
	ReleaseDate     string `json:"releaseDate"`
	DurationSeconds int    `json:"durationSeconds"`
	Views           int    `json:"views"`
	SubmittedAgo    string `json:"submittedAgo"`
	RatingPercent   *int   `json:"ratingPercent"`
	RatingVotes     *int   `json:"ratingVotes"`
	Categories      []string `json:"categories"`
	Tags            []string `json:"tags"`
	Qualities       []struct {
		Label string `json:"label"`
		URL   string `json:"url"`
	} `json:"qualities"`
	ScreenshotUrls []string `json:"screenshotUrls"`
}

var nonAlphanumeric = regexp.MustCompile(`[^a-zA-Z0-9\x{4e00}-\x{9fff}\x{3040}-\x{309f}\x{30a0}-\x{30ff}]+`)

func makeSlug(name string) string {
	slug := strings.ToLower(strings.TrimSpace(name))
	slug = nonAlphanumeric.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	if slug == "" {
		slug = fmt.Sprintf("item-%d", time.Now().UnixNano())
	}
	return slug
}

func main() {
	dir := flag.String("dir", "./parsed-json", "JSON files directory")
	dbPath := flag.String("db", "./data/balili.db", "SQLite database path")
	batchSize := flag.Int("batch", 500, "Batch insert size")
	reset := flag.Bool("reset", false, "Drop existing tables before import")
	flag.Parse()

	fmt.Printf("=== Balili Data Import Tool ===\n")
	fmt.Printf("Directory: %s\n", *dir)
	fmt.Printf("Database:  %s\n", *dbPath)
	fmt.Printf("Batch:     %d\n\n", *batchSize)

	if err := database.Init(*dbPath); err != nil {
		fmt.Fprintf(os.Stderr, "DB init failed: %v\n", err)
		os.Exit(1)
	}

	db := database.DB

	if *reset {
		fmt.Println("Dropping existing tables...")
		db.Migrator().DropTable(
			"video_categories", "video_tags",
			&model.Screenshot{}, &model.Quality{},
			&model.Video{}, &model.Category{}, &model.Tag{},
		)
		db.AutoMigrate(
			&model.Video{}, &model.Category{}, &model.Tag{},
			&model.Screenshot{}, &model.Quality{},
		)
	}

	files, err := filepath.Glob(filepath.Join(*dir, "*.json"))
	if err != nil {
		fmt.Fprintf(os.Stderr, "Glob failed: %v\n", err)
		os.Exit(1)
	}
	total := len(files)
	fmt.Printf("Found %d JSON files\n\n", total)

	categoryCache := make(map[string]*model.Category)
	tagCache := make(map[string]*model.Tag)

	// preload caches
	var allCategories []model.Category
	db.Find(&allCategories)
	for i := range allCategories {
		categoryCache[allCategories[i].Name] = &allCategories[i]
	}
	var allTags []model.Tag
	db.Find(&allTags)
	for i := range allTags {
		tagCache[allTags[i].Name] = &allTags[i]
	}

	imported, skipped, failed := 0, 0, 0
	batch := make([]jsonVideo, 0, *batchSize)
	batchFiles := make([]string, 0, *batchSize)

	for i, file := range files {
		data, err := os.ReadFile(file)
		if err != nil {
			failed++
			continue
		}
		var jv jsonVideo
		if err := json.Unmarshal(data, &jv); err != nil {
			failed++
			continue
		}
		batch = append(batch, jv)
		batchFiles = append(batchFiles, file)

		if len(batch) >= *batchSize || i == total-1 {
			tx := db.Begin()
			for _, jv := range batch {
				// check duplicate
				var count int64
				db.Model(&model.Video{}).Where("video_id = ?", jv.VideoID).Count(&count)
				if count > 0 {
					skipped++
					continue
				}

				var releaseDate *time.Time
				if jv.ReleaseDate != "" {
					if t, err := time.Parse("2006-01-02", jv.ReleaseDate); err == nil {
						releaseDate = &t
					}
				}

				// Calculate upvotes and downvotes from ratingPercent and ratingVotes
				upvotes := 0
				downvotes := 0
				if jv.RatingPercent != nil && jv.RatingVotes != nil && *jv.RatingVotes > 0 {
					upvotes = int(float64(*jv.RatingVotes) * float64(*jv.RatingPercent) / 100.0)
					downvotes = *jv.RatingVotes - upvotes
				}

				video := model.Video{
					VideoID:         jv.VideoID,
					Title:           jv.Title,
					PosterImage:     jv.PosterImage,
					ReleaseDate:     releaseDate,
					DurationSeconds: jv.DurationSeconds,
					Views:           jv.Views,
					SubmittedAgo:    jv.SubmittedAgo,
					Upvotes:         upvotes,
					Downvotes:       downvotes,
				}

				// categories
				for _, catName := range jv.Categories {
					catName = strings.TrimSpace(catName)
					if catName == "" {
						continue
					}
					cat, ok := categoryCache[catName]
					if !ok {
						cat = &model.Category{
							Name: catName,
							Slug: makeSlug(catName),
						}
						tx.Clauses(clause.OnConflict{DoNothing: true}).Create(cat)
						// reload to get ID
						tx.Where("name = ?", catName).First(cat)
						categoryCache[catName] = cat
					}
					video.Categories = append(video.Categories, *cat)
				}

				// tags
				for _, tagName := range jv.Tags {
					tagName = strings.TrimSpace(tagName)
					if tagName == "" {
						continue
					}
					tag, ok := tagCache[tagName]
					if !ok {
						tag = &model.Tag{
							Name: tagName,
							Slug: makeSlug(tagName),
						}
						tx.Clauses(clause.OnConflict{DoNothing: true}).Create(tag)
						tx.Where("name = ?", tagName).First(tag)
						tagCache[tagName] = tag
					}
					video.Tags = append(video.Tags, *tag)
				}

				// screenshots
				for idx, url := range jv.ScreenshotUrls {
					video.Screenshots = append(video.Screenshots, model.Screenshot{
						URL:       url,
						SortOrder: idx,
					})
				}

				// qualities (label + url)
				for _, q := range jv.Qualities {
					video.Qualities = append(video.Qualities, model.Quality{
						Label: q.Label,
						URL:   q.URL,
					})
				}

				if err := tx.Create(&video).Error; err != nil {
					failed++
					continue
				}
				imported++
			}
			tx.Commit()
			batch = batch[:0]
			batchFiles = batchFiles[:0]
		}

		if (i+1)%1000 == 0 || i == total-1 {
			fmt.Printf("Progress: %d/%d files processed (imported: %d, skipped: %d, failed: %d)\n",
				i+1, total, imported, skipped, failed)
		}
	}

	// update video counts
	fmt.Println("\nUpdating category and tag video counts...")
	db.Exec(`UPDATE categories SET video_count = (
		SELECT COUNT(*) FROM video_categories WHERE video_categories.category_id = categories.id
	)`)
	db.Exec(`UPDATE tags SET video_count = (
		SELECT COUNT(*) FROM video_tags WHERE video_tags.tag_id = tags.id
	)`)

	fmt.Printf("\n=== Import Complete ===\n")
	fmt.Printf("Total files: %d\n", total)
	fmt.Printf("Imported:    %d\n", imported)
	fmt.Printf("Skipped:     %d\n", skipped)
	fmt.Printf("Failed:      %d\n", failed)
}
