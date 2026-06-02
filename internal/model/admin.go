package model

import "time"

type Admin struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"size:50;uniqueIndex;not null" json:"username"`
	Password  string    `gorm:"column:password;size:200" json:"-"`
	CreatedAt time.Time `json:"createdAt"`
}
