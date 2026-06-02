package handler

import (
	"net/http"
	"strconv"

	"balili/internal/dto"
	"balili/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type VideoHandler struct {
	videoSvc *service.VideoService
	db       *gorm.DB
}

func NewVideoHandler(videoSvc *service.VideoService, db *gorm.DB) *VideoHandler {
	return &VideoHandler{videoSvc: videoSvc, db: db}
}

func (h *VideoHandler) List(c *gin.Context) {
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

func (h *VideoHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		// try video_id string
		video, err := h.videoSvc.GetByVideoID(idStr)
		if err != nil {
			c.JSON(http.StatusNotFound, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "NOT_FOUND", Message: "Video not found"}})
			return
		}
		c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: video})
		return
	}

	video, err := h.videoSvc.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "NOT_FOUND", Message: "Video not found"}})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: video})
}

func (h *VideoHandler) GetRandom(c *gin.Context) {
	count, _ := strconv.Atoi(c.DefaultQuery("count", "12"))
	videos, err := h.videoSvc.GetRandom(count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "QUERY_ERROR", Message: err.Error()}})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: videos})
}

func (h *VideoHandler) GetPopular(c *gin.Context) {
	count, _ := strconv.Atoi(c.DefaultQuery("count", "20"))
	videos, err := h.videoSvc.GetPopular(count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "QUERY_ERROR", Message: err.Error()}})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: videos})
}

func (h *VideoHandler) Search(c *gin.Context) {
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

	videos, total, err := h.videoSvc.Search(params)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_QUERY", Message: err.Error()}})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Data:    videos,
		Meta:    service.BuildMeta(params.PaginationParams, total),
	})
}
