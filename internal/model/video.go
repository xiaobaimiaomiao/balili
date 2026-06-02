package model

import "time"

type Video struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	VideoID         string     `gorm:"size:50;uniqueIndex;not null" json:"videoId"`
	Title           string     `gorm:"size:500;not null" json:"title"`
	Description     string     `gorm:"size:5000" json:"description"`
	PosterImage     string     `gorm:"size:1000" json:"posterImage"`
	ReleaseDate     *time.Time `json:"releaseDate"`
	DurationSeconds int        `gorm:"default:0" json:"durationSeconds"`
	Views           int        `gorm:"default:0;index" json:"views"`
	LikesCount      int        `gorm:"default:0;index" json:"likesCount"`
	Upvotes         int        `gorm:"default:0" json:"upvotes"`
	Downvotes       int        `gorm:"default:0" json:"downvotes"`
	SubmittedAgo    string     `gorm:"size:100" json:"submittedAgo"`
	UploadedByID    *uint      `gorm:"index" json:"uploadedById"`
	UploadedByName  string     `gorm:"size:100" json:"uploadedByName"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`

	Categories  []Category   `gorm:"many2many:video_categories" json:"categories"`
	Tags        []Tag        `gorm:"many2many:video_tags" json:"tags"`
	Screenshots []Screenshot `gorm:"foreignKey:VideoID;constraint:OnDelete:CASCADE" json:"screenshots"`
	Qualities   []Quality    `gorm:"foreignKey:VideoID;constraint:OnDelete:CASCADE" json:"qualities"`
	Comments    []Comment    `gorm:"foreignKey:VideoID;constraint:OnDelete:CASCADE" json:"comments"`
}
