package handler

import (
	"net/http"
	"strconv"

	"balili/internal/dto"
	"balili/internal/model"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type InteractionHandler struct {
	db *gorm.DB
}

func NewInteractionHandler(db *gorm.DB) *InteractionHandler {
	return &InteractionHandler{db: db}
}

// IncrementView increments view count when video is played
func (h *InteractionHandler) IncrementView(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_ID", Message: "Invalid video ID"}})
		return
	}

	result := h.db.Model(&model.Video{}).Where("id = ?", id).UpdateColumn("views", gorm.Expr("views + ?", 1))
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "UPDATE_ERROR", Message: result.Error.Error()}})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "NOT_FOUND", Message: "Video not found"}})
		return
	}

	var views int
	h.db.Model(&model.Video{}).Select("views").Where("id = ?", id).Scan(&views)
	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: gin.H{"views": views}})
}

// ToggleLike adds or removes a like (requires auth)
func (h *InteractionHandler) ToggleLike(c *gin.Context) {
	// Check if user is authenticated
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "UNAUTHORIZED", Message: "Login required to like videos"}})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_ID", Message: "Invalid video ID"}})
		return
	}

	// Use userID + videoID for unique like tracking
	var existing model.Like
	result := h.db.Where("video_id = ? AND user_id = ?", id, userID).First(&existing)

	if result.Error == nil {
		// Unlike
		h.db.Delete(&existing)
		h.db.Model(&model.Video{}).Where("id = ?", id).UpdateColumn("likes_count", gorm.Expr("MAX(likes_count - 1, 0)"))
	} else {
		// Like
		h.db.Create(&model.Like{VideoID: uint(id), UserID: userID.(uint)})
		h.db.Model(&model.Video{}).Where("id = ?", id).UpdateColumn("likes_count", gorm.Expr("likes_count + ?", 1))
	}

	var likesCount int
	h.db.Model(&model.Video{}).Select("likes_count").Where("id = ?", id).Scan(&likesCount)

	liked := result.Error != nil // if we didn't find existing, we just liked
	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: gin.H{"liked": liked, "likesCount": likesCount}})
}

// GetTrendingLikes returns videos with most recent likes
func (h *InteractionHandler) GetTrendingLikes(c *gin.Context) {
	count, _ := strconv.Atoi(c.DefaultQuery("count", "8"))

	var videos []model.Video
	h.db.Model(&model.Video{}).
		Preload("Categories").
		Joins("LEFT JOIN likes ON likes.video_id = videos.id").
		Where("likes.created_at >= datetime('now', '-7 days')").
		Group("videos.id").
		Order("COUNT(likes.id) DESC, videos.likes_count DESC").
		Limit(count).
		Find(&videos)

	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: videos})
}

// ListComments returns comments for a video
func (h *InteractionHandler) ListComments(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_ID", Message: "Invalid video ID"}})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 20
	}

	var total int64
	h.db.Model(&model.Comment{}).Where("video_id = ?", id).Count(&total)

	var comments []model.Comment
	h.db.Where("video_id = ?", id).
		Order("created_at desc").
		Offset((page - 1) * limit).
		Limit(limit).
		Find(&comments)

	c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Data:    comments,
		Meta: &dto.Meta{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: int((total + int64(limit) - 1) / int64(limit)),
		},
	})
}

// CreateComment adds a comment to a video (requires auth)
func (h *InteractionHandler) CreateComment(c *gin.Context) {
	userID, userExists := c.Get("userID")
	username, _ := c.Get("username")

	if !userExists {
		c.JSON(http.StatusUnauthorized, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "UNAUTHORIZED", Message: "Login required to comment"}})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_ID", Message: "Invalid video ID"}})
		return
	}

	var body struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_PARAMS", Message: err.Error()}})
		return
	}

	if len(body.Content) > 2000 {
		body.Content = body.Content[:2000]
	}

	nickname := ""
	if username != nil {
		nickname = username.(string)
	}

	comment := model.Comment{
		VideoID:  uint(id),
		UserID:   userID.(uint),
		Nickname: nickname,
		Content:  body.Content,
	}
	if err := h.db.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "CREATE_ERROR", Message: err.Error()}})
		return
	}

	c.JSON(http.StatusCreated, dto.APIResponse{Success: true, Data: comment})
}

// DeleteComment removes a comment (admin)
func (h *InteractionHandler) DeleteComment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("commentId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_ID", Message: "Invalid comment ID"}})
		return
	}

	h.db.Delete(&model.Comment{}, id)
	c.JSON(http.StatusOK, dto.APIResponse{Success: true})
}

// Vote handles upvote/downvote (requires auth)
func (h *InteractionHandler) Vote(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "UNAUTHORIZED", Message: "Login required to vote"}})
		return
	}

	videoID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_ID", Message: "Invalid video ID"}})
		return
	}

	var body struct {
		IsUp bool `json:"isUp"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_PARAMS", Message: err.Error()}})
		return
	}

	uid := userID.(uint)
	vid := uint(videoID)

	var existing model.Vote
	result := h.db.Where("video_id = ? AND user_id = ?", vid, uid).First(&existing)

	if result.Error == nil {
		if existing.IsUp == body.IsUp {
			h.db.Delete(&existing)
			if body.IsUp {
				h.db.Model(&model.Video{}).Where("id = ?", vid).UpdateColumn("upvotes", gorm.Expr("upvotes - 1"))
			} else {
				h.db.Model(&model.Video{}).Where("id = ?", vid).UpdateColumn("downvotes", gorm.Expr("downvotes - 1"))
			}
		} else {
			oldIsUp := existing.IsUp
			existing.IsUp = body.IsUp
			h.db.Save(&existing)
			if body.IsUp {
				h.db.Model(&model.Video{}).Where("id = ?", vid).UpdateColumn("upvotes", gorm.Expr("upvotes + 1"))
				h.db.Model(&model.Video{}).Where("id = ?", vid).UpdateColumn("downvotes", gorm.Expr("downvotes - 1"))
			} else {
				h.db.Model(&model.Video{}).Where("id = ?", vid).UpdateColumn("downvotes", gorm.Expr("downvotes + 1"))
				h.db.Model(&model.Video{}).Where("id = ?", vid).UpdateColumn("upvotes", gorm.Expr("upvotes - 1"))
			}
			_ = oldIsUp
		}
	} else {
		h.db.Create(&model.Vote{VideoID: vid, UserID: uid, IsUp: body.IsUp})
		if body.IsUp {
			h.db.Model(&model.Video{}).Where("id = ?", vid).UpdateColumn("upvotes", gorm.Expr("upvotes + 1"))
		} else {
			h.db.Model(&model.Video{}).Where("id = ?", vid).UpdateColumn("downvotes", gorm.Expr("downvotes + 1"))
		}
	}

	var video model.Video
	h.db.Select("upvotes, downvotes").Where("id = ?", vid).First(&video)

	var userVote *bool
	var currentVote model.Vote
	if err := h.db.Where("video_id = ? AND user_id = ?", vid, uid).First(&currentVote).Error; err == nil {
		userVote = &currentVote.IsUp
	}

	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: gin.H{
		"upvotes":    video.Upvotes,
		"downvotes":  video.Downvotes,
		"userVote":   userVote,
		"rating":     calcRating(video.Upvotes, video.Downvotes),
		"totalVotes": video.Upvotes + video.Downvotes,
	}})
}

func calcRating(upvotes, downvotes int) float64 {
	total := upvotes + downvotes
	if total == 0 {
		return 0
	}
	return float64(upvotes) / float64(total) * 100
}

// GetVoteStatus returns current vote status for a video
func (h *InteractionHandler) GetVoteStatus(c *gin.Context) {
	videoID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_ID", Message: "Invalid video ID"}})
		return
	}

	var video model.Video
	h.db.Select("upvotes, downvotes").Where("id = ?", videoID).First(&video)

	var userVote *bool
	if userID, exists := c.Get("userID"); exists {
		var vote model.Vote
		if err := h.db.Where("video_id = ? AND user_id = ?", videoID, userID).First(&vote).Error; err == nil {
			userVote = &vote.IsUp
		}
	}

	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: gin.H{
		"upvotes":    video.Upvotes,
		"downvotes":  video.Downvotes,
		"userVote":   userVote,
		"rating":     calcRating(video.Upvotes, video.Downvotes),
		"totalVotes": video.Upvotes + video.Downvotes,
	}})
}
