package model

import "time"

type Country struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	Name       string    `gorm:"size:100;uniqueIndex;not null" json:"name"`
	VideoCount int       `gorm:"default:0" json:"videoCount"`
	CreatedAt  time.Time `json:"createdAt"`
}
