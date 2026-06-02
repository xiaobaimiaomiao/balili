package model

import "time"

type Comment struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	VideoID   uint      `gorm:"index;not null" json:"videoId"`
	UserID    uint      `gorm:"index;default:0" json:"userId"`
	Nickname  string    `gorm:"size:100;not null" json:"nickname"`
	Content   string    `gorm:"size:2000;not null" json:"content"`
	CreatedAt time.Time `json:"createdAt"`
}
