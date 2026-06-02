package service

import (
	"errors"
	"math"
	"time"

	"balili/internal/dto"
	"balili/internal/model"
	"balili/internal/repository"
)

type VideoService struct {
	repo     *repository.VideoRepository
	catRepo  *repository.CategoryRepository
	tagRepo  *repository.TagRepository
}

func NewVideoService(repo *repository.VideoRepository, catRepo *repository.CategoryRepository, tagRepo *repository.TagRepository) *VideoService {
	return &VideoService{repo: repo, catRepo: catRepo, tagRepo: tagRepo}
}

func (s *VideoService) List(params dto.VideoListParams) ([]model.Video, int64, error) {
	return s.repo.List(params)
}

func (s *VideoService) GetByID(id uint) (*model.Video, error) {
	return s.repo.GetByID(id)
}

func (s *VideoService) GetByVideoID(videoID string) (*model.Video, error) {
	return s.repo.GetByVideoID(videoID)
}

func (s *VideoService) Create(req dto.VideoCreateRequest) (*model.Video, error) {
	video := &model.Video{
		VideoID:         req.VideoID,
		Title:           req.Title,
		Description:     req.Description,
		PosterImage:     req.PosterImage,
		DurationSeconds: req.DurationSeconds,
		Views:           req.Views,
		SubmittedAgo:    req.SubmittedAgo,
		UploadedByName:  req.UploadedByName,
	}

	if req.ReleaseDate != "" {
		if t, err := time.Parse("2006-01-02", req.ReleaseDate); err == nil {
			video.ReleaseDate = &t
		}
	}

	// load categories
	for _, catID := range req.CategoryIDs {
		cat, err := s.catRepo.GetByID(catID)
		if err == nil {
			video.Categories = append(video.Categories, *cat)
		}
	}

	// load tags by IDs
	for _, tagID := range req.TagIDs {
		tag, err := s.tagRepo.GetByID(tagID)
		if err == nil {
			video.Tags = append(video.Tags, *tag)
		}
	}

	// screenshots
	for i, url := range req.Screenshots {
		video.Screenshots = append(video.Screenshots, model.Screenshot{URL: url, SortOrder: i})
	}

	// qualities (label + url)
	for _, q := range req.Qualities {
		video.Qualities = append(video.Qualities, model.Quality{Label: q.Label, URL: q.URL})
	}

	if err := s.repo.Create(video); err != nil {
		return nil, err
	}
	return video, nil
}

func (s *VideoService) Update(id uint, req dto.VideoUpdateRequest) (*model.Video, error) {
	video, err := s.repo.GetByID(id)
	if err != nil {
		return nil, errors.New("video not found")
	}

	if req.Title != nil {
		video.Title = *req.Title
	}
	if req.Description != nil {
		video.Description = *req.Description
	}
	if req.PosterImage != nil {
		video.PosterImage = *req.PosterImage
	}
	if req.DurationSeconds != nil {
		video.DurationSeconds = *req.DurationSeconds
	}
	if req.Views != nil {
		video.Views = *req.Views
	}
	if req.SubmittedAgo != nil {
		video.SubmittedAgo = *req.SubmittedAgo
	}
	if req.VideoID != nil {
		video.VideoID = *req.VideoID
	}
	if req.UploadedByName != nil {
		video.UploadedByName = *req.UploadedByName
	}

	// Update categories
	if req.CategoryIDs != nil {
		var categories []model.Category
		for _, catID := range req.CategoryIDs {
			cat, err := s.catRepo.GetByID(catID)
			if err == nil {
				categories = append(categories, *cat)
			}
		}
		video.Categories = categories
	}

	// Update tags
	if req.TagIDs != nil {
		var tags []model.Tag
		for _, tagID := range req.TagIDs {
			tag, err := s.tagRepo.GetByID(tagID)
			if err == nil {
				tags = append(tags, *tag)
			}
		}
		video.Tags = tags
	}

	if err := s.repo.Update(video); err != nil {
		return nil, err
	}
	return s.repo.GetByID(id)
}

func (s *VideoService) Delete(id uint) error {
	return s.repo.Delete(id)
}

func (s *VideoService) GetRandom(count int) ([]model.Video, error) {
	if count <= 0 {
		count = 10
	}
	return s.repo.GetRandom(count)
}

func (s *VideoService) GetRecent(count int) ([]model.Video, error) {
	if count <= 0 {
		count = 20
	}
	return s.repo.GetRecent(count)
}

func (s *VideoService) GetPopular(count int) ([]model.Video, error) {
	if count <= 0 {
		count = 20
	}
	return s.repo.GetPopular(count)
}

func (s *VideoService) Search(params dto.VideoListParams) ([]model.Video, int64, error) {
	if params.Q == "" {
		return nil, 0, errors.New("search query is required")
	}
	return s.repo.List(params)
}

func BuildMeta(params dto.PaginationParams, total int64) *dto.Meta {
	return &dto.Meta{
		Page:       params.Page,
		Limit:      params.Limit,
		Total:      total,
		TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
	}
}
