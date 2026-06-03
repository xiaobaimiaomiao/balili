package handler

import (
	"net/http"
	"time"

	"balili/internal/dto"
	"balili/internal/model"
	"balili/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type StatsHandler struct {
	db       *gorm.DB
	videoSvc *service.VideoService
	catSvc   *service.CategoryService
}

func NewStatsHandler(db *gorm.DB, videoSvc *service.VideoService, catSvc *service.CategoryService) *StatsHandler {
	return &StatsHandler{db: db, videoSvc: videoSvc, catSvc: catSvc}
}

func (h *StatsHandler) Overview(c *gin.Context) {
	var totalVideos, totalViews, totalCategories, totalTags int64
	h.db.Model(&model.Video{}).Count(&totalVideos)
	h.db.Model(&model.Video{}).Select("COALESCE(SUM(views),0)").Scan(&totalViews)
	h.db.Model(&model.Category{}).Count(&totalCategories)
	h.db.Model(&model.Tag{}).Count(&totalTags)

	c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Data: gin.H{
			"totalVideos":     totalVideos,
			"totalViews":      totalViews,
			"totalCategories": totalCategories,
			"totalTags":       totalTags,
		},
	})
}

func (h *StatsHandler) Dashboard(c *gin.Context) {
	var totalVideos, totalViews, totalCategories, totalTags int64
	h.db.Model(&model.Video{}).Count(&totalVideos)
	h.db.Model(&model.Video{}).Select("COALESCE(SUM(views),0)").Scan(&totalViews)
	h.db.Model(&model.Category{}).Count(&totalCategories)
	h.db.Model(&model.Tag{}).Count(&totalTags)

	// avg rating
	var avgRating float64
	h.db.Model(&model.Video{}).Where("rating_percent IS NOT NULL AND rating_percent > 0").
		Select("COALESCE(AVG(rating_percent),0)").Scan(&avgRating)

	// recent videos
	recentVideos, _ := h.videoSvc.GetRecent(10)

	// top categories
	topCats, _ := h.catSvc.GetTopCategories(10)
	var catCounts []dto.CategoryCount
	for _, cat := range topCats {
		catCounts = append(catCounts, dto.CategoryCount{Name: cat.Name, Slug: cat.Slug, Count: cat.VideoCount})
	}

	// views by month
	var monthViews []dto.MonthViews
	h.db.Model(&model.Video{}).
		Select("strftime('%Y-%m', release_date) as month, SUM(views) as views").
		Where("release_date IS NOT NULL").
		Group("month").
		Order("month").
		Scan(&monthViews)

	c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Data: dto.DashboardData{
			TotalVideos:     totalVideos,
			TotalViews:      totalViews,
			TotalCategories: totalCategories,
			TotalTags:       totalTags,
			AvgRating:       avgRating,
			RecentVideos:    toInterfaceSlice(recentVideos),
			TopCategories:   catCounts,
			ViewsByMonth:    monthViews,
		},
	})
}

func (h *StatsHandler) Charts(c *gin.Context) {
	// views by month
	var monthViews []dto.MonthViews
	h.db.Model(&model.Video{}).
		Select("strftime('%Y-%m', release_date) as month, SUM(views) as views").
		Where("release_date IS NOT NULL").
		Group("month").
		Order("month").
		Scan(&monthViews)

	// category distribution
	var catCounts []dto.CategoryCount
	topCats, _ := h.catSvc.GetTopCategories(20)
	for _, cat := range topCats {
		catCounts = append(catCounts, dto.CategoryCount{Name: cat.Name, Slug: cat.Slug, Count: cat.VideoCount})
	}

	// daily uploads (last 30 days)
	type DayCount struct {
		Date  string `json:"date"`
		Count int    `json:"count"`
	}
	var dailyUploads []DayCount
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30).Format("2006-01-02")
	h.db.Model(&model.Video{}).
		Select("date(created_at) as date, COUNT(*) as count").
		Where("created_at >= ?", thirtyDaysAgo).
		Group("date").
		Order("date").
		Scan(&dailyUploads)

	c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Data: gin.H{
			"viewsByMonth":  monthViews,
			"categories":    catCounts,
			"dailyUploads":  dailyUploads,
		},
	})
}

func toInterfaceSlice(videos []model.Video) []interface{} {
	result := make([]interface{}, len(videos))
	for i, v := range videos {
		result[i] = v
	}
	return result
}

// ViewsByGranularity returns view counts grouped by a user-chosen granularity.
func (h *StatsHandler) ViewsByGranularity(c *gin.Context) {
	g := c.DefaultQuery("granularity", "month") // minute, hour, day, month, year

	var format string
	switch g {
	case "minute":
		format = "%Y-%m-%d %H:%M"
	case "hour":
		format = "%Y-%m-%d %H:00"
	case "day":
		format = "%Y-%m-%d"
	case "year":
		format = "%Y"
	default: // month
		format = "%Y-%m"
	}

	var results []dto.MonthViews
	h.db.Model(&model.Video{}).
		Select("strftime('"+format+"', created_at) as month, SUM(views) as views").
		Group("month").
		Order("month").
		Scan(&results)

	c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Data:    results,
	})
}
