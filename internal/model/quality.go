package model

type Quality struct {
	ID      uint   `gorm:"primaryKey" json:"id"`
	VideoID uint   `gorm:"index;not null" json:"videoId"`
	Label   string `gorm:"size:50;not null" json:"label"`
	URL     string `gorm:"size:2000" json:"url"`
}
