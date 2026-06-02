package repository

import (
	"balili/internal/model"

	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

type UserListParams struct {
	Page    int
	Limit   int
	Search  string
	OrderBy string
}

func (r *UserRepository) List(params UserListParams) ([]model.User, int64, error) {
	var users []model.User
	var total int64

	query := r.db.Model(&model.User{})

	if params.Search != "" {
		like := "%" + params.Search + "%"
		query = query.Where("username LIKE ? OR nickname LIKE ? OR email LIKE ?", like, like, like)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	order := params.OrderBy
	if order == "" {
		order = "created_at desc"
	}

	page := params.Page
	if page < 1 {
		page = 1
	}
	limit := params.Limit
	if limit <= 0 {
		limit = 20
	}

	err := query.
		Order(order).
		Offset((page - 1) * limit).
		Limit(limit).
		Find(&users).Error

	return users, total, err
}

func (r *UserRepository) GetByID(id uint) (*model.User, error) {
	var user model.User
	if err := r.db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) GetByUsername(username string) (*model.User, error) {
	var user model.User
	if err := r.db.Where("username = ?", username).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) Update(id uint, updates map[string]interface{}) (*model.User, error) {
	if err := r.db.Model(&model.User{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, err
	}
	return r.GetByID(id)
}

func (r *UserRepository) Delete(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		tx.Where("user_id = ?", id).Delete(&model.Like{})
		tx.Where("user_id = ?", id).Delete(&model.Vote{})
		tx.Where("user_id = ?", id).Delete(&model.Comment{})
		tx.Exec("UPDATE videos SET uploaded_by_id = NULL WHERE uploaded_by_id = ?", id)
		return tx.Delete(&model.User{}, id).Error
	})
}

func (r *UserRepository) Stats(userID uint) (map[string]int64, error) {
	stats := make(map[string]int64)

	var videoCount int64
	r.db.Model(&model.Video{}).Where("uploaded_by_id = ?", userID).Count(&videoCount)
	stats["videos"] = videoCount

	var commentCount int64
	r.db.Model(&model.Comment{}).Where("user_id = ?", userID).Count(&commentCount)
	stats["comments"] = commentCount

	var likeCount int64
	r.db.Model(&model.Like{}).Where("user_id = ?", userID).Count(&likeCount)
	stats["likes"] = likeCount

	var voteCount int64
	r.db.Model(&model.Vote{}).Where("user_id = ?", userID).Count(&voteCount)
	stats["votes"] = voteCount

	var totalViews int64
	r.db.Model(&model.Video{}).Where("uploaded_by_id = ?", userID).
		Select("COALESCE(SUM(views), 0)").Scan(&totalViews)
	stats["totalViews"] = totalViews

	return stats, nil
}
