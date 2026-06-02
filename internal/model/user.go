package model

import "time"

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"size:50;uniqueIndex;not null" json:"username"`
	Email     string    `gorm:"size:100;uniqueIndex" json:"email"`
	Nickname  string    `gorm:"size:100" json:"nickname"`
	Password  string    `gorm:"column:password;size:200" json:"-"`
	Avatar    string    `gorm:"size:500" json:"avatar"`
	CreatedAt time.Time `json:"createdAt"`
}
