package repository

import (
	"balili/internal/dto"
	"balili/internal/model"

	"gorm.io/gorm"
)

type VideoRepository struct {
	db *gorm.DB
}

func NewVideoRepository(db *gorm.DB) *VideoRepository {
	return &VideoRepository{db: db}
}

func (r *VideoRepository) List(params dto.VideoListParams) ([]model.Video, int64, error) {
	var videos []model.Video
	var total int64

	query := r.db.Model(&model.Video{})

	if params.Q != "" {
		query = query.Where("title LIKE ?", "%"+params.Q+"%")
	}
	if params.CategoryID > 0 {
		query = query.Where("videos.id IN (?)",
			r.db.Model(&model.Video{}).
				Joins("JOIN video_categories ON video_categories.video_id = videos.id").
				Where("video_categories.category_id = ?", params.CategoryID).
				Select("videos.id"))
	} else if params.Category != "" {
		query = query.Where("videos.id IN (?)",
			r.db.Model(&model.Video{}).
				Joins("JOIN video_categories ON video_categories.video_id = videos.id").
				Joins("JOIN categories ON categories.id = video_categories.category_id").
				Where("categories.slug = ?", params.Category).
				Select("videos.id"))
	}
	if params.Tag != "" {
		query = query.Where("videos.id IN (?)",
			r.db.Model(&model.Video{}).
				Joins("JOIN video_tags ON video_tags.video_id = videos.id").
				Joins("JOIN tags ON tags.id = video_tags.tag_id").
				Where("tags.slug = ?", params.Tag).
				Select("videos.id"))
	}

	query.Count(&total)

	sort := params.Sort
	if sort == "" {
		sort = "created_at"
	}
	order := params.Order
	if order == "" {
		order = "desc"
	}

	err := query.
		Preload("Categories").
		Preload("Tags").
		Order(sort + " " + order).
		Offset(params.GetOffset()).
		Limit(params.Limit).
		Find(&videos).Error

	return videos, total, err
}

func (r *VideoRepository) GetByID(id uint) (*model.Video, error) {
	var video model.Video
	err := r.db.
		Preload("Categories").
		Preload("Tags").
		Preload("Screenshots").
		Preload("Qualities").
		First(&video, id).Error
	if err != nil {
		return nil, err
	}
	return &video, nil
}

func (r *VideoRepository) GetByVideoID(videoID string) (*model.Video, error) {
	var video model.Video
	err := r.db.
		Preload("Categories").
		Preload("Tags").
		Preload("Screenshots").
		Preload("Qualities").
		Where("video_id = ?", videoID).
		First(&video).Error
	if err != nil {
		return nil, err
	}
	return &video, nil
}

func (r *VideoRepository) Create(video *model.Video) error {
	return r.db.Create(video).Error
}

func (r *VideoRepository) Update(video *model.Video) error {
	return r.db.Save(video).Error
}

func (r *VideoRepository) Delete(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		tx.Where("video_id = ?", id).Delete(&model.Screenshot{})
		tx.Where("video_id = ?", id).Delete(&model.Quality{})
		tx.Model(&model.Video{}).Where("id = ?", id).
			UpdateColumns(map[string]interface{}{"categories": gorm.Expr("NULL"), "tags": gorm.Expr("NULL")})
		tx.Exec("DELETE FROM video_categories WHERE video_id = ?", id)
		tx.Exec("DELETE FROM video_tags WHERE video_id = ?", id)
		return tx.Delete(&model.Video{}, id).Error
	})
}

func (r *VideoRepository) GetRandom(count int) ([]model.Video, error) {
	var videos []model.Video
	err := r.db.
		Preload("Categories").
		Order("RANDOM()").
		Limit(count).
		Find(&videos).Error
	return videos, err
}

func (r *VideoRepository) GetRecent(count int) ([]model.Video, error) {
	var videos []model.Video
	err := r.db.
		Preload("Categories").
		Order("created_at desc").
		Limit(count).
		Find(&videos).Error
	return videos, err
}

func (r *VideoRepository) GetPopular(count int) ([]model.Video, error) {
	var videos []model.Video
	err := r.db.
		Preload("Categories").
		Order("views desc").
		Limit(count).
		Find(&videos).Error
	return videos, err
}
