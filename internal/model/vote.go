package model

import "time"

type Vote struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	VideoID   uint      `gorm:"index;not null" json:"videoId"`
	UserID    uint      `gorm:"index;not null" json:"userId"`
	IsUp      bool      `gorm:"not null" json:"isUp"`
	CreatedAt time.Time `json:"createdAt"`
}