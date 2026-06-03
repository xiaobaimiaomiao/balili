package handler

import (
	"net/http"

	"balili/internal/dto"
	"balili/internal/service"

	"github.com/gin-gonic/gin"
)

type CountryHandler struct {
	countrySvc *service.CountryService
}

func NewCountryHandler(countrySvc *service.CountryService) *CountryHandler {
	return &CountryHandler{countrySvc: countrySvc}
}

func (h *CountryHandler) List(c *gin.Context) {
	countries, err := h.countrySvc.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "QUERY_ERROR", Message: err.Error()}})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: countries})
}
