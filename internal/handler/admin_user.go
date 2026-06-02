package handler

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"balili/internal/dto"
	"balili/internal/model"
	"balili/internal/repository"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AdminUserHandler struct {
	repo *repository.UserRepository
	db   *gorm.DB
}

func NewAdminUserHandler(repo *repository.UserRepository, db *gorm.DB) *AdminUserHandler {
	return &AdminUserHandler{repo: repo, db: db}
}

type adminUserListItem struct {
	ID           uint      `json:"id"`
	Username     string    `json:"username"`
	Nickname     string    `json:"nickname"`
	Email        string    `json:"email"`
	Avatar       string    `json:"avatar"`
	CreatedAt    time.Time `json:"createdAt"`
	VideoCount   int64     `json:"videoCount"`
	CommentCount int64     `json:"commentCount"`
	LikeCount    int64     `json:"likeCount"`
}

// ListUsers returns a paginated list of all users for the admin
func (h *AdminUserHandler) ListUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	search := strings.TrimSpace(c.Query("q"))
	orderBy := c.DefaultQuery("orderBy", "created_at desc")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	users, total, err := h.repo.List(repository.UserListParams{
		Page:    page,
		Limit:   limit,
		Search:  search,
		OrderBy: orderBy,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "QUERY_ERROR", Message: err.Error()}})
		return
	}

	out := make([]adminUserListItem, 0, len(users))
	for _, u := range users {
		stats, _ := h.repo.Stats(u.ID)
		out = append(out, adminUserListItem{
			ID:           u.ID,
			Username:     u.Username,
			Nickname:     u.Nickname,
			Email:        u.Email,
			Avatar:       u.Avatar,
			CreatedAt:    u.CreatedAt,
			VideoCount:   stats["videos"],
			CommentCount: stats["comments"],
			LikeCount:    stats["likes"],
		})
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages < 1 {
		totalPages = 1
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Data:    out,
		Meta: &dto.Meta{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: totalPages,
		},
	})
}

type adminVideoSummary struct {
	ID          uint      `json:"id"`
	VideoID     string    `json:"videoId"`
	Title       string    `json:"title"`
	PosterImage string    `json:"posterImage"`
	Views       int       `json:"views"`
	LikesCount  int       `json:"likesCount"`
	Upvotes     int       `json:"upvotes"`
	Downvotes   int       `json:"downvotes"`
	CreatedAt   time.Time `json:"createdAt"`
}

type adminCommentItem struct {
	ID         uint      `json:"id"`
	VideoID    uint      `json:"videoId"`
	VideoTitle string    `json:"videoTitle"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"createdAt"`
}

// GetUser returns detailed information about a single user, including all activity stats
func (h *AdminUserHandler) GetUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_ID", Message: "Invalid user ID"}})
		return
	}

	user, err := h.repo.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "NOT_FOUND", Message: "User not found"}})
		return
	}

	stats, _ := h.repo.Stats(user.ID)

	recentVideos := make([]adminVideoSummary, 0)
	h.db.Model(&model.Video{}).
		Select("id, video_id, title, poster_image, views, likes_count, upvotes, downvotes, created_at").
		Where("uploaded_by_id = ?", user.ID).
		Order("created_at desc").
		Limit(10).
		Scan(&recentVideos)

	recentComments := make([]adminCommentItem, 0)
	h.db.Table("comments").
		Select("comments.id, comments.video_id, videos.title as video_title, comments.content, comments.created_at").
		Joins("LEFT JOIN videos ON videos.id = comments.video_id").
		Where("comments.user_id = ?", user.ID).
		Order("comments.created_at desc").
		Limit(10).
		Scan(&recentComments)

	c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Data: gin.H{
			"id":             user.ID,
			"username":       user.Username,
			"nickname":       user.Nickname,
			"email":          user.Email,
			"avatar":         user.Avatar,
			"createdAt":      user.CreatedAt,
			"videoCount":     stats["videos"],
			"commentCount":   stats["comments"],
			"likeCount":      stats["likes"],
			"voteCount":      stats["votes"],
			"totalViews":     stats["totalViews"],
			"recentVideos":   recentVideos,
			"recentComments": recentComments,
		},
	})
}

// UpdateUser updates editable profile fields for a user
func (h *AdminUserHandler) UpdateUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_ID", Message: "Invalid user ID"}})
		return
	}

	var body struct {
		Username *string `json:"username"`
		Nickname *string `json:"nickname"`
		Email    *string `json:"email"`
		Avatar   *string `json:"avatar"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_PARAMS", Message: err.Error()}})
		return
	}

	updates := map[string]interface{}{}
	if body.Username != nil {
		un := strings.TrimSpace(*body.Username)
		if un == "" || len(un) < 2 || len(un) > 50 {
			c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_USERNAME", Message: "Username must be 2-50 characters"}})
			return
		}
		var count int64
		h.db.Model(&model.User{}).Where("username = ? AND id <> ?", un, id).Count(&count)
		if count > 0 {
			c.JSON(http.StatusConflict, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "USERNAME_TAKEN", Message: "Username already in use"}})
			return
		}
		updates["username"] = un
	}
	if body.Nickname != nil {
		updates["nickname"] = strings.TrimSpace(*body.Nickname)
	}
	if body.Email != nil {
		updates["email"] = strings.TrimSpace(*body.Email)
	}
	if body.Avatar != nil {
		updates["avatar"] = *body.Avatar
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "NO_CHANGES", Message: "No fields to update"}})
		return
	}

	user, err := h.repo.Update(uint(id), updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "UPDATE_ERROR", Message: err.Error()}})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: gin.H{
		"id":        user.ID,
		"username":  user.Username,
		"nickname":  user.Nickname,
		"email":     user.Email,
		"avatar":    user.Avatar,
		"createdAt": user.CreatedAt,
	}})
}

// DeleteUser removes a user and cleans up their activity records
func (h *AdminUserHandler) DeleteUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_ID", Message: "Invalid user ID"}})
		return
	}

	if _, err := h.repo.GetByID(uint(id)); err != nil {
		c.JSON(http.StatusNotFound, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "NOT_FOUND", Message: "User not found"}})
		return
	}

	if err := h.repo.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "DELETE_ERROR", Message: err.Error()}})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{Success: true})
}
