package handler

import (
	"net/http"

	"balili/internal/dto"
	"balili/internal/service"

	"github.com/gin-gonic/gin"
)

type CategoryHandler struct {
	catSvc *service.CategoryService
}

func NewCategoryHandler(catSvc *service.CategoryService) *CategoryHandler {
	return &CategoryHandler{catSvc: catSvc}
}

func (h *CategoryHandler) List(c *gin.Context) {
	categories, err := h.catSvc.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "QUERY_ERROR", Message: err.Error()}})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: categories})
}

func (h *CategoryHandler) GetBySlug(c *gin.Context) {
	slug := c.Param("slug")
	cat, err := h.catSvc.GetBySlug(slug)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "NOT_FOUND", Message: "Category not found"}})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: cat})
}
