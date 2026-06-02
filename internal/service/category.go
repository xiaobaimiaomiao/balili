package service

import (
	"errors"

	"balili/internal/dto"
	"balili/internal/model"
	"balili/internal/repository"

	"strings"
	"regexp"
)

type CategoryService struct {
	repo *repository.CategoryRepository
}

func NewCategoryService(repo *repository.CategoryRepository) *CategoryService {
	return &CategoryService{repo: repo}
}

func (s *CategoryService) List() ([]model.Category, error) {
	return s.repo.List()
}

func (s *CategoryService) GetBySlug(slug string) (*model.Category, error) {
	return s.repo.GetBySlug(slug)
}

func (s *CategoryService) GetByID(id uint) (*model.Category, error) {
	return s.repo.GetByID(id)
}

var nonAlphaNum = regexp.MustCompile(`[^a-zA-Z0-9\x{4e00}-\x{9fff}\x{3040}-\x{309f}\x{30a0}-\x{30ff}]+`)

func makeSlug(name string) string {
	slug := strings.ToLower(strings.TrimSpace(name))
	slug = nonAlphaNum.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	return slug
}

func (s *CategoryService) Create(req dto.CategoryCreateRequest) (*model.Category, error) {
	slug := req.Slug
	if slug == "" {
		slug = makeSlug(req.Name)
	}
	cat := &model.Category{Name: req.Name, Slug: slug}
	if err := s.repo.Create(cat); err != nil {
		return nil, err
	}
	return cat, nil
}

func (s *CategoryService) Update(id uint, req dto.CategoryUpdateRequest) (*model.Category, error) {
	cat, err := s.repo.GetByID(id)
	if err != nil {
		return nil, errors.New("category not found")
	}
	if req.Name != nil {
		cat.Name = *req.Name
	}
	if req.Slug != nil {
		cat.Slug = *req.Slug
	}
	if err := s.repo.Update(cat); err != nil {
		return nil, err
	}
	return cat, nil
}

func (s *CategoryService) Delete(id uint) error {
	return s.repo.Delete(id)
}

func (s *CategoryService) GetTopCategories(limit int) ([]model.Category, error) {
	if limit <= 0 {
		limit = 10
	}
	return s.repo.GetTopCategories(limit)
}
