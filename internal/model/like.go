package model

import "time"

type Like struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	VideoID   uint      `gorm:"index;not null" json:"videoId"`
	UserID    uint      `gorm:"index;not null;default:0" json:"userId"`
	CreatedAt time.Time `json:"createdAt"`
}
