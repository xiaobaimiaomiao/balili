package service

import (
	"errors"

	"balili/internal/dto"
	"balili/internal/model"
	"balili/internal/repository"
)

type CountryService struct {
	repo *repository.CountryRepository
}

func NewCountryService(repo *repository.CountryRepository) *CountryService {
	return &CountryService{repo: repo}
}

func (s *CountryService) List() ([]model.Country, error) {
	return s.repo.List()
}

func (s *CountryService) GetByID(id uint) (*model.Country, error) {
	return s.repo.GetByID(id)
}

func (s *CountryService) Create(req dto.CountryCreateRequest) (*model.Country, error) {
	country := &model.Country{Name: req.Name}
	if err := s.repo.Create(country); err != nil {
		return nil, err
	}
	return country, nil
}

func (s *CountryService) Update(id uint, req dto.CountryUpdateRequest) (*model.Country, error) {
	country, err := s.repo.GetByID(id)
	if err != nil {
		return nil, errors.New("country not found")
	}
	if req.Name != nil {
		country.Name = *req.Name
	}
	if err := s.repo.Update(country); err != nil {
		return nil, err
	}
	return country, nil
}

func (s *CountryService) Delete(id uint) error {
	return s.repo.Delete(id)
}
