package repository

import (
	"balili/internal/model"

	"gorm.io/gorm"
)

type CountryRepository struct {
	db *gorm.DB
}

func NewCountryRepository(db *gorm.DB) *CountryRepository {
	return &CountryRepository{db: db}
}

func (r *CountryRepository) List() ([]model.Country, error) {
	var countries []model.Country
	err := r.db.Order("video_count desc").Find(&countries).Error
	return countries, err
}

func (r *CountryRepository) GetByID(id uint) (*model.Country, error) {
	var country model.Country
	err := r.db.First(&country, id).Error
	if err != nil {
		return nil, err
	}
	return &country, nil
}

func (r *CountryRepository) GetByName(name string) (*model.Country, error) {
	var country model.Country
	err := r.db.Where("name = ?", name).First(&country).Error
	if err != nil {
		return nil, err
	}
	return &country, nil
}

func (r *CountryRepository) Create(country *model.Country) error {
	return r.db.Create(country).Error
}

func (r *CountryRepository) Update(country *model.Country) error {
	return r.db.Save(country).Error
}

func (r *CountryRepository) Delete(id uint) error {
	return r.db.Delete(&model.Country{}, id).Error
}
