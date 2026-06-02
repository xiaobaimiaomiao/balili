package database

import (
	"fmt"
	"os"
	"path/filepath"

	"balili/internal/model"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Init(dbPath string) error {
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("create db dir: %w", err)
	}

	db, err := gorm.Open(sqlite.Open(dbPath+"?_journal_mode=WAL&_busy_timeout=5000"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return fmt.Errorf("open sqlite: %w", err)
	}

	if err := db.AutoMigrate(
		&model.Video{},
		&model.Category{},
		&model.Tag{},
		&model.Screenshot{},
		&model.Quality{},
		&model.Like{},
		&model.Vote{},
		&model.Comment{},
		&model.User{},
		&model.Admin{},
	); err != nil {
		return fmt.Errorf("auto migrate: %w", err)
	}

	// Update video counts for categories and tags
	db.Exec(`UPDATE categories SET video_count = (
		SELECT COUNT(*) FROM video_categories WHERE video_categories.category_id = categories.id
	)`)
	db.Exec(`UPDATE tags SET video_count = (
		SELECT COUNT(*) FROM video_tags WHERE video_tags.tag_id = tags.id
	)`)

	DB = db
	return nil
}
