package dto

type PaginationParams struct {
	Page  int `form:"page" binding:"omitempty,min=1"`
	Limit int `form:"limit" binding:"omitempty,min=1,max=100"`
}

func (p *PaginationParams) GetOffset() int {
	if p.Page <= 0 {
		p.Page = 1
	}
	if p.Limit <= 0 {
		p.Limit = 20
	}
	return (p.Page - 1) * p.Limit
}

type VideoListParams struct {
	PaginationParams
	Sort       string `form:"sort" binding:"omitempty,oneof=views likes_count release_date rating_percent created_at"`
	Order      string `form:"order" binding:"omitempty,oneof=asc desc"`
	Category   string `form:"category"`
	CategoryID uint   `form:"categoryId"`
	Tag        string `form:"tag"`
	Tags       string `form:"tags"`
	Country    string `form:"country"`
	Year       int    `form:"year"`
	Q          string `form:"q"`
}

type VideoCreateRequest struct {
	Title           string   `json:"title" binding:"required"`
	VideoID         string   `json:"videoId" binding:"required"`
	Description     string   `json:"description"`
	PosterImage     string   `json:"posterImage"`
	ReleaseDate     string   `json:"releaseDate"`
	DurationSeconds int      `json:"durationSeconds"`
	Views           int      `json:"views"`
	SubmittedAgo    string   `json:"submittedAgo"`
	UploadedByName  string   `json:"uploadedByName"`
	Year            int      `json:"year"`
	Country         string   `json:"country"`
	CategoryIDs     []uint   `json:"categoryIds"`
	TagIDs          []uint   `json:"tagIds"`
	Screenshots     []string `json:"screenshots"`
	Qualities       []struct {
		Label string `json:"label"`
		URL   string `json:"url"`
	} `json:"qualities"`
}

type VideoUpdateRequest struct {
	Title           *string  `json:"title"`
	Description     *string  `json:"description"`
	PosterImage     *string  `json:"posterImage"`
	ReleaseDate     *string  `json:"releaseDate"`
	DurationSeconds *int     `json:"durationSeconds"`
	Views           *int     `json:"views"`
	SubmittedAgo    *string  `json:"submittedAgo"`
	VideoID         *string  `json:"videoId"`
	UploadedByName  *string  `json:"uploadedByName"`
	Year            *int     `json:"year"`
	Country         *string  `json:"country"`
	CategoryIDs     []uint   `json:"categoryIds"`
	TagIDs          []uint   `json:"tagIds"`
}

type CategoryCreateRequest struct {
	Name string `json:"name" binding:"required"`
	Slug string `json:"slug"`
}

type CategoryUpdateRequest struct {
	Name *string `json:"name"`
	Slug *string `json:"slug"`
}

type CountryCreateRequest struct {
	Name string `json:"name" binding:"required"`
}

type CountryUpdateRequest struct {
	Name *string `json:"name"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Meta    *Meta       `json:"meta,omitempty"`
	Error   *APIError   `json:"error,omitempty"`
}

type Meta struct {
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int `json:"totalPages"`
}

type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type DashboardData struct {
	TotalVideos     int64              `json:"totalVideos"`
	TotalViews      int64              `json:"totalViews"`
	TotalCategories int64              `json:"totalCategories"`
	TotalTags       int64              `json:"totalTags"`
	AvgRating       float64            `json:"avgRating"`
	RecentVideos    []interface{}      `json:"recentVideos"`
	TopCategories   []CategoryCount    `json:"topCategories"`
	ViewsByMonth    []MonthViews       `json:"viewsByMonth"`
}

type CategoryCount struct {
	Name  string `json:"name"`
	Slug  string `json:"slug"`
	Count int    `json:"count"`
}

type MonthViews struct {
	Month string `json:"month"`
	Views int64  `json:"views"`
}
