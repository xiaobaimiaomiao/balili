package model

type Screenshot struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	VideoID   uint   `gorm:"index;not null" json:"videoId"`
	URL       string `gorm:"size:1000;not null" json:"url"`
	SortOrder int    `gorm:"default:0" json:"sortOrder"`
}
