package model

import "time"

type Category struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"size:200;uniqueIndex;not null" json:"name"`
	Slug        string    `gorm:"size:200;uniqueIndex;not null" json:"slug"`
	VideoCount  int       `gorm:"default:0" json:"videoCount"`
	CreatedAt   time.Time `json:"createdAt"`
}
