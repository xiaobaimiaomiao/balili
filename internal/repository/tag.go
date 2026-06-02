package repository

import (
	"balili/internal/model"

	"gorm.io/gorm"
)

type TagRepository struct {
	db *gorm.DB
}

func NewTagRepository(db *gorm.DB) *TagRepository {
	return &TagRepository{db: db}
}

func (r *TagRepository) List(limit int) ([]model.Tag, error) {
	var tags []model.Tag
	query := r.db.Order("video_count desc")
	if limit > 0 {
		query = query.Limit(limit)
	}
	err := query.Find(&tags).Error
	return tags, err
}

func (r *TagRepository) GetBySlug(slug string) (*model.Tag, error) {
	var tag model.Tag
	err := r.db.Where("slug = ?", slug).First(&tag).Error
	if err != nil {
		return nil, err
	}
	return &tag, nil
}

func (r *TagRepository) GetByID(id uint) (*model.Tag, error) {
	var tag model.Tag
	err := r.db.First(&tag, id).Error
	if err != nil {
		return nil, err
	}
	return &tag, nil
}

func (r *TagRepository) Delete(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		tx.Exec("DELETE FROM video_tags WHERE tag_id = ?", id)
		return tx.Delete(&model.Tag{}, id).Error
	})
}
