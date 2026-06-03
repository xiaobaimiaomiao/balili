package handler

import (
	"math"
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
	now := time.Now()
	today := now.Format("2006-01-02")
	sevenDaysAgo := now.AddDate(0, 0, -7).Format("2006-01-02")
	fourteenDaysAgo := now.AddDate(0, 0, -14).Format("2006-01-02")
	thirtyDaysAgo := now.AddDate(0, 0, -30).Format("2006-01-02")
	sixtyDaysAgo := now.AddDate(0, 0, -60).Format("2006-01-02")

	// ---- KPI counts ----
	var totalVideos, totalViews, totalUsers, totalLikes, totalComments int64
	var totalCategories, totalTags int64
	h.db.Model(&model.Video{}).Count(&totalVideos)
	h.db.Model(&model.Video{}).Select("COALESCE(SUM(views),0)").Scan(&totalViews)
	h.db.Model(&model.User{}).Count(&totalUsers)
	h.db.Model(&model.Like{}).Count(&totalLikes)
	h.db.Model(&model.Comment{}).Count(&totalComments)
	h.db.Model(&model.Category{}).Count(&totalCategories)
	h.db.Model(&model.Tag{}).Count(&totalTags)

	// ---- Growth: this 7d vs prev 7d ----
	var viewsThis7d, viewsPrev7d int64
	h.db.Model(&model.Video{}).Select("COALESCE(SUM(views),0)").Where("created_at >= ?", sevenDaysAgo).Scan(&viewsThis7d)
	h.db.Model(&model.Video{}).Select("COALESCE(SUM(views),0)").Where("created_at >= ? AND created_at < ?", fourteenDaysAgo, sevenDaysAgo).Scan(&viewsPrev7d)

	var usersThis7d, usersPrev7d int64
	h.db.Model(&model.User{}).Where("created_at >= ?", sevenDaysAgo).Count(&usersThis7d)
	h.db.Model(&model.User{}).Where("created_at >= ? AND created_at < ?", fourteenDaysAgo, sevenDaysAgo).Count(&usersPrev7d)

	var videosThis7d, videosPrev7d int64
	h.db.Model(&model.Video{}).Where("created_at >= ?", sevenDaysAgo).Count(&videosThis7d)
	h.db.Model(&model.Video{}).Where("created_at >= ? AND created_at < ?", fourteenDaysAgo, sevenDaysAgo).Count(&videosPrev7d)

	var likesThis7d, likesPrev7d int64
	h.db.Model(&model.Like{}).Where("created_at >= ?", sevenDaysAgo).Count(&likesThis7d)
	h.db.Model(&model.Like{}).Where("created_at >= ? AND created_at < ?", fourteenDaysAgo, sevenDaysAgo).Count(&likesPrev7d)

	var commentsThis7d, commentsPrev7d int64
	h.db.Model(&model.Comment{}).Where("created_at >= ?", sevenDaysAgo).Count(&commentsThis7d)
	h.db.Model(&model.Comment{}).Where("created_at >= ? AND created_at < ?", fourteenDaysAgo, sevenDaysAgo).Count(&commentsPrev7d)

	growthPct := func(this, prev int64) float64 {
		if prev == 0 {
			if this > 0 {
				return 100
			}
			return 0
		}
		return math.Round(float64(this-prev)/float64(prev)*1000) / 10
	}

	kpis := []dto.KPIItem{
		{Label: "Total Views", Value: totalViews, Change: growthPct(viewsThis7d, viewsPrev7d), Icon: "Eye", Color: "#6366F1"},
		{Label: "Videos", Value: totalVideos, Change: growthPct(videosThis7d, videosPrev7d), Icon: "Film", Color: "#EC4899"},
		{Label: "Users", Value: totalUsers, Change: growthPct(usersThis7d, usersPrev7d), Icon: "Users", Color: "#8B5CF6"},
		{Label: "Likes", Value: totalLikes, Change: growthPct(likesThis7d, likesPrev7d), Icon: "Heart", Color: "#F59E0B"},
		{Label: "Comments", Value: totalComments, Change: growthPct(commentsThis7d, commentsPrev7d), Icon: "MessageCircle", Color: "#22C55E"},
		{Label: "Categories", Value: totalCategories, Change: 0, Icon: "FolderOpen", Color: "#06B6D4"},
	}

	// ---- Views trend (last 12 months) ----
	var viewsTrend []dto.MonthViews
	twelveMonthsAgo := now.AddDate(-1, 0, 0).Format("2006-01-02")
	h.db.Model(&model.Video{}).
		Select("strftime('%Y-%m', created_at) as month, COALESCE(SUM(views),0) as views").
		Where("created_at >= ?", twelveMonthsAgo).
		Group("month").Order("month").
		Scan(&viewsTrend)

	// ---- Uploads trend (last 30 days) ----
	var uploadsTrend []dto.DayCount
	h.db.Model(&model.Video{}).
		Select("date(created_at) as date, COUNT(*) as count").
		Where("created_at >= ?", thirtyDaysAgo).
		Group("date").Order("date").
		Scan(&uploadsTrend)

	// ---- Category distribution ----
	var catCounts []dto.CategoryCount
	topCats, _ := h.catSvc.GetTopCategories(12)
	for _, cat := range topCats {
		catCounts = append(catCounts, dto.CategoryCount{Name: cat.Name, Slug: cat.Slug, Count: cat.VideoCount})
	}

	// ---- Top 10 videos by views ----
	var topVideosRaw []model.Video
	h.db.Order("views desc").Limit(10).Find(&topVideosRaw)
	var topVideos []dto.TopVideoItem
	for _, v := range topVideosRaw {
		tv := dto.TopVideoItem{
			ID: v.ID, Title: v.Title, PosterImage: v.PosterImage,
			Views: v.Views, LikesCount: v.LikesCount, Upvotes: v.Upvotes, Downvotes: v.Downvotes,
			DurationSeconds: v.DurationSeconds, UploadedByName: v.UploadedByName,
			Country: v.Country, CreatedAt: v.CreatedAt.Format(time.RFC3339),
		}
		topVideos = append(topVideos, tv)
	}

	// ---- Views by country (top 10) ----
	var countryViews []dto.CountryViews
	h.db.Model(&model.Video{}).
		Select("country, COALESCE(SUM(views),0) as views, COUNT(*) as count").
		Where("country != ''").
		Group("country").Order("views desc").Limit(10).
		Scan(&countryViews)

	// ---- Recent 8 videos ----
	recentVideos, _ := h.videoSvc.GetRecent(8)

	// ---- User growth (last 30 days) ----
	var userGrowth []dto.DayCount
	h.db.Model(&model.User{}).
		Select("date(created_at) as date, COUNT(*) as count").
		Where("created_at >= ?", thirtyDaysAgo).
		Group("date").Order("date").
		Scan(&userGrowth)

	// ---- Top tags ----
	var topTags []dto.TagCount
	h.db.Model(&model.Tag{}).
		Select("name, video_count as count").
		Order("video_count desc").Limit(10).
		Scan(&topTags)

	// ---- Engagement rate (likes+comments per view) ----
	var engagementRate float64
	if totalViews > 0 {
		engagementRate = math.Round(float64(totalLikes+totalComments)/float64(totalViews)*10000) / 100
	}

	// ---- Average duration ----
	var avgDuration float64
	h.db.Model(&model.Video{}).Where("duration_seconds > 0").
		Select("COALESCE(AVG(duration_seconds),0)").Scan(&avgDuration)

	// Suppress unused variable warnings
	_ = today
	_ = sixtyDaysAgo

	c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Data: dto.DashboardResponse{
			KPIs:           kpis,
			ViewsTrend:     viewsTrend,
			UploadsTrend:   uploadsTrend,
			CategoryDist:   catCounts,
			TopVideos:      topVideos,
			ViewsByCountry: countryViews,
			RecentVideos:   toInterfaceSlice(recentVideos),
			UserGrowth:     userGrowth,
			TopTags:        topTags,
			EngagementRate: engagementRate,
			AvgDuration:    int(avgDuration),
		},
	})
}

func (h *StatsHandler) Charts(c *gin.Context) {
	now := time.Now()
	thirtyDaysAgo := now.AddDate(0, 0, -30).Format("2006-01-02")
	twelveMonthsAgo := now.AddDate(-1, 0, 0).Format("2006-01-02")

	// views by month (12 months)
	var monthViews []dto.MonthViews
	h.db.Model(&model.Video{}).
		Select("strftime('%Y-%m', created_at) as month, COALESCE(SUM(views),0) as views").
		Where("created_at >= ?", twelveMonthsAgo).
		Group("month").Order("month").
		Scan(&monthViews)

	// category distribution
	var catCounts []dto.CategoryCount
	topCats, _ := h.catSvc.GetTopCategories(20)
	for _, cat := range topCats {
		catCounts = append(catCounts, dto.CategoryCount{Name: cat.Name, Slug: cat.Slug, Count: cat.VideoCount})
	}

	// daily uploads (last 30 days)
	var dailyUploads []dto.DayCount
	h.db.Model(&model.Video{}).
		Select("date(created_at) as date, COUNT(*) as count").
		Where("created_at >= ?", thirtyDaysAgo).
		Group("date").Order("date").
		Scan(&dailyUploads)

	// views by country
	var countryViews []dto.CountryViews
	h.db.Model(&model.Video{}).
		Select("country, COALESCE(SUM(views),0) as views, COUNT(*) as count").
		Where("country != ''").
		Group("country").Order("views desc").Limit(15).
		Scan(&countryViews)

	// top tags
	var topTags []dto.TagCount
	h.db.Model(&model.Tag{}).
		Select("name, video_count as count").
		Order("video_count desc").Limit(15).
		Scan(&topTags)

	// user growth (last 30 days)
	var userGrowth []dto.DayCount
	h.db.Model(&model.User{}).
		Select("date(created_at) as date, COUNT(*) as count").
		Where("created_at >= ?", thirtyDaysAgo).
		Group("date").Order("date").
		Scan(&userGrowth)

	// views by hour of day (for heatmap-like display)
	var hourViews []dto.HourViews
	h.db.Model(&model.Video{}).
		Select("strftime('%H', created_at) as hour, COALESCE(SUM(views),0) as views").
		Group("hour").Order("hour").
		Scan(&hourViews)

	// duration distribution
	type durRow struct {
		Dur int `json:"dur"`
		Cnt int `json:"cnt"`
	}
	var durRows []durRow
	h.db.Model(&model.Video{}).
		Select("duration_seconds as dur, COUNT(*) as cnt").
		Where("duration_seconds > 0").
		Group("duration_seconds").
		Scan(&durRows)

	buckets := map[string]int{
		"0-5 min":   0,
		"5-15 min":  0,
		"15-30 min": 0,
		"30-60 min": 0,
		"60-120 min": 0,
		"120+ min":  0,
	}
	for _, r := range durRows {
		switch {
		case r.Dur < 300:
			buckets["0-5 min"] += r.Cnt
		case r.Dur < 900:
			buckets["5-15 min"] += r.Cnt
		case r.Dur < 1800:
			buckets["15-30 min"] += r.Cnt
		case r.Dur < 3600:
			buckets["30-60 min"] += r.Cnt
		case r.Dur < 7200:
			buckets["60-120 min"] += r.Cnt
		default:
			buckets["120+ min"] += r.Cnt
		}
	}
	var durationDist []dto.DurationBucket
	for _, r := range []string{"0-5 min", "5-15 min", "15-30 min", "30-60 min", "60-120 min", "120+ min"} {
		durationDist = append(durationDist, dto.DurationBucket{Range: r, Count: buckets[r]})
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Data: dto.ChartsResponse{
			ViewsByMonth:   monthViews,
			Categories:     catCounts,
			DailyUploads:   dailyUploads,
			ViewsByCountry: countryViews,
			TopTags:        topTags,
			UserGrowth:     userGrowth,
			ViewsByHour:    hourViews,
			DurationDist:   durationDist,
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
// Query params: granularity=day|week|month|year, range=7d|4w|3m|6m|1y|all
func (h *StatsHandler) ViewsByGranularity(c *gin.Context) {
	g := c.DefaultQuery("granularity", "month")
	r := c.DefaultQuery("range", "")

	var format string
	switch g {
	case "minute":
		format = "%Y-%m-%d %H:%M"
	case "hour":
		format = "%Y-%m-%d %H:00"
	case "day":
		format = "%Y-%m-%d"
	case "week":
		format = "%Y-W%W"
	case "year":
		format = "%Y"
	default:
		format = "%Y-%m"
	}

	// Build time window from range param
	now := time.Now()
	var since string
	switch r {
	case "7d":
		since = now.AddDate(0, 0, -7).Format("2006-01-02")
	case "4w":
		since = now.AddDate(0, 0, -28).Format("2006-01-02")
	case "3m":
		since = now.AddDate(0, -3, 0).Format("2006-01-02")
	case "6m":
		since = now.AddDate(0, -6, 0).Format("2006-01-02")
	case "1y":
		since = now.AddDate(-1, 0, 0).Format("2006-01-02")
	case "all":
		since = ""
	default:
		// Auto-select range based on granularity
		switch g {
		case "day":
			since = now.AddDate(0, 0, -30).Format("2006-01-02")
		case "week":
			since = now.AddDate(0, 0, -56).Format("2006-01-02")
		case "year":
			since = ""
		default:
			since = now.AddDate(-1, 0, 0).Format("2006-01-02")
		}
	}

	query := h.db.Model(&model.Video{})
	if since != "" {
		query = query.Where("created_at >= ?", since)
	}

	var results []dto.MonthViews
	query.
		Select("strftime('" + format + "', created_at) as month, SUM(views) as views").
		Group("month").
		Order("month").
		Scan(&results)

	c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Data:    results,
	})
}
