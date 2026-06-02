package handler

import (
	"net/http"
	"strconv"
	"strings"

	"balili/internal/dto"
	"balili/internal/model"
	"balili/internal/repository"
	"balili/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AdminHandler struct {
	videoSvc *service.VideoService
	catSvc   *service.CategoryService
	tagRepo  *repository.TagRepository
	db       *gorm.DB
}

func NewAdminHandler(videoSvc *service.VideoService, catSvc *service.CategoryService, tagRepo *repository.TagRepository, db *gorm.DB) *AdminHandler {
	return &AdminHandler{videoSvc: videoSvc, catSvc: catSvc, tagRepo: tagRepo, db: db}
}

// ---- Video CRUD ----

func (h *AdminHandler) ListVideos(c *gin.Context) {
	var params dto.VideoListParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_PARAMS", Message: err.Error()}})
		return
	}
	if params.Page == 0 {
		params.Page = 1
	}
	if params.Limit == 0 {
		params.Limit = 20
	}
	videos, total, err := h.videoSvc.List(params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "QUERY_ERROR", Message: err.Error()}})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Data:    videos,
		Meta:    service.BuildMeta(params.PaginationParams, total),
	})
}

func (h *AdminHandler) CreateVideo(c *gin.Context) {
	var req dto.VideoCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_PARAMS", Message: err.Error()}})
		return
	}
	video, err := h.videoSvc.Create(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "CREATE_ERROR", Message: err.Error()}})
		return
	}
	c.JSON(http.StatusCreated, dto.APIResponse{Success: true, Data: video})
}

func (h *AdminHandler) UpdateVideo(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_ID", Message: "Invalid video ID"}})
		return
	}

	var req dto.VideoUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_PARAMS", Message: err.Error()}})
		return
	}

	video, err := h.videoSvc.Update(uint(id), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "UPDATE_ERROR", Message: err.Error()}})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: video})
}

func (h *AdminHandler) DeleteVideo(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_ID", Message: "Invalid video ID"}})
		return
	}

	if err := h.videoSvc.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "DELETE_ERROR", Message: err.Error()}})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Success: true})
}

// ---- Category CRUD ----

func (h *AdminHandler) ListCategories(c *gin.Context) {
	cats, err := h.catSvc.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "QUERY_ERROR", Message: err.Error()}})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: cats})
}

func (h *AdminHandler) CreateCategory(c *gin.Context) {
	var req dto.CategoryCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_PARAMS", Message: err.Error()}})
		return
	}
	cat, err := h.catSvc.Create(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "CREATE_ERROR", Message: err.Error()}})
		return
	}
	c.JSON(http.StatusCreated, dto.APIResponse{Success: true, Data: cat})
}

func (h *AdminHandler) UpdateCategory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_ID", Message: "Invalid category ID"}})
		return
	}
	var req dto.CategoryUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_PARAMS", Message: err.Error()}})
		return
	}
	cat, err := h.catSvc.Update(uint(id), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "UPDATE_ERROR", Message: err.Error()}})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: cat})
}

func (h *AdminHandler) DeleteCategory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_ID", Message: "Invalid category ID"}})
		return
	}
	if err := h.catSvc.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "DELETE_ERROR", Message: err.Error()}})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Success: true})
}

// ---- Tags ----

func (h *AdminHandler) ListTags(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "1000"))
	tags, err := h.tagRepo.List(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "QUERY_ERROR", Message: err.Error()}})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: tags})
}

func (h *AdminHandler) DeleteTag(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_ID", Message: "Invalid tag ID"}})
		return
	}
	if err := h.tagRepo.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "DELETE_ERROR", Message: err.Error()}})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Success: true})
}

// ---- Helpers ----

func (h *AdminHandler) updateVideoCounts() {
	h.db.Exec(`UPDATE categories SET video_count = (
		SELECT COUNT(*) FROM video_categories WHERE video_categories.category_id = categories.id
	)`)
	h.db.Exec(`UPDATE tags SET video_count = (
		SELECT COUNT(*) FROM video_tags WHERE video_tags.tag_id = tags.id
	)`)
}

// GetVideoForAdmin fetches a single video for admin editing
func (h *AdminHandler) GetVideo(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_ID", Message: "Invalid video ID"}})
		return
	}
	video, err := h.videoSvc.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "NOT_FOUND", Message: "Video not found"}})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: video})
}

// UpdateVideoRelations handles category/tag relation updates
func (h *AdminHandler) UpdateVideoRelations(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_ID", Message: "Invalid video ID"}})
		return
	}

	video, err := h.videoSvc.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "NOT_FOUND", Message: "Video not found"}})
		return
	}

	var body struct {
		CategoryIDs []uint `json:"categoryIds"`
		TagIDs      []uint `json:"tagIds"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_PARAMS", Message: err.Error()}})
		return
	}

	// load categories
	var categories []model.Category
	if len(body.CategoryIDs) > 0 {
		h.db.Where("id IN ?", body.CategoryIDs).Find(&categories)
	}

	// load tags
	var tags []model.Tag
	if len(body.TagIDs) > 0 {
		h.db.Where("id IN ?", body.TagIDs).Find(&tags)
	}

	h.db.Model(video).Association("Categories").Replace(categories)
	h.db.Model(video).Association("Tags").Replace(tags)

	// update counts
	go h.updateVideoCounts()

	updated, _ := h.videoSvc.GetByID(uint(id))
	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: updated})
}

// GetTagByID finds a tag by ID
func (h *AdminHandler) GetTag(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_ID", Message: "Invalid tag ID"}})
		return
	}
	var tag model.Tag
	if err := h.db.First(&tag, id).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "NOT_FOUND", Message: "Tag not found"}})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: tag})
}

// CreateTag creates a new tag
func (h *AdminHandler) CreateTag(c *gin.Context) {
	var body struct {
		Name string `json:"name" binding:"required"`
		Slug string `json:"slug"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_PARAMS", Message: err.Error()}})
		return
	}
	slug := body.Slug
	if slug == "" {
		slug = strings.ToLower(strings.ReplaceAll(body.Name, " ", "-"))
	}
	tag := model.Tag{Name: body.Name, Slug: slug}
	if err := h.db.Create(&tag).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "CREATE_ERROR", Message: err.Error()}})
		return
	}
	c.JSON(http.StatusCreated, dto.APIResponse{Success: true, Data: tag})
}

// UpdateTag updates a tag's name and slug
func (h *AdminHandler) UpdateTag(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_ID", Message: "Invalid tag ID"}})
		return
	}
	var body struct {
		Name string `json:"name" binding:"required"`
		Slug string `json:"slug"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_PARAMS", Message: err.Error()}})
		return
	}
	slug := body.Slug
	if slug == "" {
		slug = strings.ToLower(strings.ReplaceAll(body.Name, " ", "-"))
	}
	if err := h.db.Model(&model.Tag{}).Where("id = ?", id).Updates(map[string]interface{}{"name": body.Name, "slug": slug}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "UPDATE_ERROR", Message: err.Error()}})
		return
	}
	var tag model.Tag
	h.db.First(&tag, id)
	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: tag})
}
