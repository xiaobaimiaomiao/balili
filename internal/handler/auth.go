package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	"unicode"

	"balili/internal/dto"
	"balili/internal/ffmpeg"
	"balili/internal/middleware"
	"balili/internal/model"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db *gorm.DB
}

func NewAuthHandler(db *gorm.DB) *AuthHandler {
	return &AuthHandler{db: db}
}

func hashPassword(password string) string {
	h := sha256.Sum256([]byte(password + "balili-salt"))
	return hex.EncodeToString(h[:])
}

// safeFilename strips any path components and dangerous characters from a
// user-supplied filename, returning a plain basename that can be safely
// concatenated into a destination path.  It also enforces a length cap.
func safeFilename(name string) string {
	name = filepath.Base(strings.ReplaceAll(name, "\\", "/"))
	name = strings.TrimSpace(name)
	if name == "" || name == "." || name == ".." {
		return "file"
	}
	cleaned := make([]rune, 0, len(name))
	for _, r := range name {
		if r == 0 || r == '/' || r == '\\' || unicode.IsControl(r) {
			cleaned = append(cleaned, '_')
			continue
		}
		cleaned = append(cleaned, r)
	}
	out := string(cleaned)
	if len(out) > 100 {
		out = out[len(out)-100:]
	}
	return out
}

// secureUploadPath verifies that the resolved destination path stays inside
// the allowed upload root, blocking ../../ style path traversal attempts.
func secureUploadPath(root, dst string) (string, error) {
	absRoot, err := filepath.Abs(root)
	if err != nil {
		return "", err
	}
	absDst, err := filepath.Abs(dst)
	if err != nil {
		return "", err
	}
	rel, err := filepath.Rel(absRoot, absDst)
	if err != nil {
		return "", err
	}
	if rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		return "", errors.New("path traversal detected")
	}
	return absDst, nil
}

// ---- User Auth ----

func (h *AuthHandler) Register(c *gin.Context) {
	var body struct {
		Username string `json:"username" binding:"required"`
		Email    string `json:"email"`
		Password string `json:"password" binding:"required"`
		Nickname string `json:"nickname"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_PARAMS", Message: err.Error()}})
		return
	}

	if len(body.Username) < 2 || len(body.Username) > 50 {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_USERNAME", Message: "Username must be 2-50 characters"}})
		return
	}
	if len(body.Password) < 6 {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "WEAK_PASSWORD", Message: "Password must be at least 6 characters"}})
		return
	}

	// Check existing user
	var count int64
	h.db.Model(&model.User{}).Where("username = ?", body.Username).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "USERNAME_TAKEN", Message: "Username already exists"}})
		return
	}

	nickname := body.Nickname
	if nickname == "" {
		nickname = body.Username
	}

	user := model.User{
		Username: body.Username,
		Email:    body.Email,
		Nickname: nickname,
		Password: hashPassword(body.Password),
	}
	if err := h.db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "CREATE_ERROR", Message: err.Error()}})
		return
	}

	token, err := middleware.GenerateToken(user.ID, user.Username, "user")
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "TOKEN_ERROR", Message: err.Error()}})
		return
	}

	c.JSON(http.StatusCreated, dto.APIResponse{Success: true, Data: gin.H{
		"token": token,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"nickname": user.Nickname,
			"email":    user.Email,
		},
	}})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var body struct {
		Login    string `json:"login" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_PARAMS", Message: err.Error()}})
		return
	}

	var user model.User
	result := h.db.Where("username = ? OR email = ?", body.Login, body.Login).First(&user)
	if result.Error != nil {
		c.JSON(http.StatusUnauthorized, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_CREDENTIALS", Message: "Invalid username or password"}})
		return
	}

	if user.Password != hashPassword(body.Password) {
		c.JSON(http.StatusUnauthorized, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_CREDENTIALS", Message: "Invalid username or password"}})
		return
	}

	token, err := middleware.GenerateToken(user.ID, user.Username, "user")
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "TOKEN_ERROR", Message: err.Error()}})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: gin.H{
		"token": token,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"nickname": user.Nickname,
			"email":    user.Email,
			"avatar":   user.Avatar,
		},
	}})
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID, _ := c.Get("userID")
	var user model.User
	if err := h.db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "NOT_FOUND", Message: "User not found"}})
		return
	}

	var videoCount int64
	h.db.Model(&model.Video{}).Where("uploaded_by_id = ?", user.ID).Count(&videoCount)

	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: gin.H{
		"id":         user.ID,
		"username":   user.Username,
		"nickname":   user.Nickname,
		"email":      user.Email,
		"avatar":     user.Avatar,
		"videoCount": videoCount,
		"createdAt":  user.CreatedAt,
	}})
}

// ---- Admin Auth ----

func (h *AuthHandler) AdminLogin(c *gin.Context) {
	var body struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_PARAMS", Message: err.Error()}})
		return
	}

	var admin model.Admin
	if err := h.db.Where("username = ?", body.Username).First(&admin).Error; err != nil {
		c.JSON(http.StatusUnauthorized, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_CREDENTIALS", Message: "Invalid admin credentials"}})
		return
	}

	if admin.Password != hashPassword(body.Password) {
		c.JSON(http.StatusUnauthorized, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_CREDENTIALS", Message: "Invalid admin credentials"}})
		return
	}

	token, err := middleware.GenerateToken(admin.ID, admin.Username, "admin")
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "TOKEN_ERROR", Message: err.Error()}})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{Success: true, Data: gin.H{
		"token": token,
		"admin": gin.H{"id": admin.ID, "username": admin.Username},
	}})
}

// ---- User Videos (public profile) ----

func (h *AuthHandler) GetUserVideos(c *gin.Context) {
	username := c.Param("username")

	var user model.User
	if err := h.db.Where("username = ?", username).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "NOT_FOUND", Message: "User not found"}})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	var total int64
	query := h.db.Model(&model.Video{}).Where("uploaded_by_id = ? OR uploaded_by_name = ?", user.ID, username)
	query.Count(&total)

	var videos []model.Video
	query.Preload("Categories").Preload("Tags").
		Order("created_at desc").
		Offset((page - 1) * limit).
		Limit(limit).
		Find(&videos)

	c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Data:    videos,
		Meta: &dto.Meta{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: int((total + int64(limit) - 1) / int64(limit)),
		},
	})
}

// ---- Video Upload (user) ----

func (h *AuthHandler) UploadVideo(c *gin.Context) {
	userID, _ := c.Get("userID")
	username, _ := c.Get("username")

	title := c.PostForm("title")
	description := c.PostForm("description")
	categoryId := c.PostForm("categoryId")
	tagIds := c.PostForm("tagIds")
	newTags := c.PostForm("newTags")
	country := c.PostForm("country")

	if title == "" {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_PARAMS", Message: "Title is required"}})
		return
	}

	// Parse tag IDs
	var selectedTagIDs []uint
	if tagIds != "" {
		for _, idStr := range strings.Split(tagIds, ",") {
			idStr = strings.TrimSpace(idStr)
			if id, err := strconv.ParseUint(idStr, 10, 64); err == nil {
				selectedTagIDs = append(selectedTagIDs, uint(id))
			}
		}
	}

	// Parse new tag names
	var newTagNames []string
	if newTags != "" {
		for _, t := range strings.Split(newTags, ",") {
			t = strings.TrimSpace(t)
			if t != "" {
				newTagNames = append(newTagNames, t)
			}
		}
	}

	// Generate video ID
	videoID := fmt.Sprintf("u%d_%d_%d", userID.(uint), time.Now().UnixMilli(), rand.Intn(999))

	uid := userID.(uint)
	uname := username.(string)
	video := model.Video{
		VideoID:        videoID,
		Title:          title,
		Description:    description,
		Country:        country,
		UploadedByID:   &uid,
		UploadedByName: uname,
	}

	// Handle category (single select)
	if catID, err := strconv.ParseUint(categoryId, 10, 64); err == nil && catID > 0 {
		var cat model.Category
		if err := h.db.First(&cat, catID).Error; err == nil {
			video.Categories = []model.Category{cat}
		}
	}

	// Handle video file
	videoFile, _ := c.FormFile("video")
	if videoFile != nil {
		uploadDir := "./uploads/videos"
		safeName := safeFilename(videoFile.Filename)
		rawPath := fmt.Sprintf("%s/%s_%s", uploadDir, videoID, safeName)
		filePath, err := secureUploadPath(uploadDir, rawPath)
		if err != nil {
			c.JSON(http.StatusBadRequest, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "INVALID_FILENAME", Message: "Invalid video filename"}})
			return
		}
		if err := c.SaveUploadedFile(videoFile, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "UPLOAD_ERROR", Message: "Failed to save video file"}})
			return
		}
		// Add quality entry
		video.Qualities = append(video.Qualities, model.Quality{
			Label: "Original",
			URL:   "/uploads/videos/" + videoID + "_" + safeName,
		})

		// Auto-generate cover + preview screenshots with ffmpeg.
		// If ffmpeg is missing or the file can't be probed we keep the
		// upload and just skip the thumbnails.
		ffmpegBin, ferr := ffmpeg.FindExecutable()
		if ferr == nil {
			thumbs, gerr := ffmpeg.Generate(
				ffmpegBin,
				filePath,
				videoID,
				"./uploads/posters",
				"./uploads/screenshots",
				"/uploads",
				ffmpeg.ScreenshotCount(5),
				ffmpeg.ScreenshotWidth(640),
			)
			if gerr == nil && thumbs != nil {
				if _, statErr := os.Stat(thumbs.CoverPath); statErr == nil {
					video.PosterImage = thumbs.PublicCover
				}
				for i, p := range thumbs.Screenshots {
					if _, statErr := os.Stat(p); statErr == nil {
						video.Screenshots = append(video.Screenshots, model.Screenshot{
							URL:       thumbs.PublicShots[i],
							SortOrder: i,
						})
					}
				}
			}
		}
	}

	// Optional manual poster/screenshot fields (kept for backward compat but
	// the ffmpeg-generated ones above are the source of truth in practice).
	posterFile, _ := c.FormFile("poster")
	if posterFile != nil && video.PosterImage == "" {
		uploadDir := "./uploads/posters"
		safeName := safeFilename(posterFile.Filename)
		rawPath := fmt.Sprintf("%s/%s_%s", uploadDir, videoID, safeName)
		filePath, err := secureUploadPath(uploadDir, rawPath)
		if err == nil {
			if err := c.SaveUploadedFile(posterFile, filePath); err == nil {
				video.PosterImage = "/uploads/posters/" + videoID + "_" + safeName
			}
		}
	}

	for i := 0; i < 5; i++ {
		key := fmt.Sprintf("screenshot%d", i)
		ssFile, _ := c.FormFile(key)
		if ssFile != nil {
			uploadDir := "./uploads/screenshots"
			safeName := safeFilename(ssFile.Filename)
			rawPath := fmt.Sprintf("%s/%s_%d_%s", uploadDir, videoID, i, safeName)
			filePath, err := secureUploadPath(uploadDir, rawPath)
			if err == nil {
				if err := c.SaveUploadedFile(ssFile, filePath); err == nil {
					hasSlot := false
					for _, s := range video.Screenshots {
						if s.SortOrder == i {
							hasSlot = true
							break
						}
					}
					if !hasSlot {
						video.Screenshots = append(video.Screenshots, model.Screenshot{
							URL:       "/uploads/screenshots/" + videoID + "_" + fmt.Sprintf("%d", i) + "_" + safeName,
							SortOrder: i,
						})
					}
				}
			}
		}
	}

	// Handle tags: existing tag IDs
	if len(selectedTagIDs) > 0 {
		var tags []model.Tag
		h.db.Where("id IN ?", selectedTagIDs).Find(&tags)
		video.Tags = append(video.Tags, tags...)
	}

	// Handle tags: new tag names (create if not exists)
	for _, tagName := range newTagNames {
		var tag model.Tag
		result := h.db.Where("name = ?", tagName).First(&tag)
		if result.Error != nil {
			slug := strings.ToLower(strings.ReplaceAll(tagName, " ", "-"))
			tag = model.Tag{Name: tagName, Slug: slug}
			h.db.Create(&tag)
		}
		video.Tags = append(video.Tags, tag)
	}

	if err := h.db.Create(&video).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Success: false, Error: &dto.APIError{Code: "CREATE_ERROR", Message: err.Error()}})
		return
	}

	// Update counts
	h.db.Exec(`UPDATE tags SET video_count = (SELECT COUNT(*) FROM video_tags WHERE video_tags.tag_id = tags.id)`)
	h.db.Exec(`UPDATE categories SET video_count = (SELECT COUNT(*) FROM video_categories WHERE video_categories.category_id = categories.id)`)
	if country != "" {
		h.db.Exec(`UPDATE countries SET video_count = (SELECT COUNT(*) FROM videos WHERE country = countries.name)`)
	}

	c.JSON(http.StatusCreated, dto.APIResponse{Success: true, Data: video})
}

// EnsureAdmin creates a default admin if none exists, or fixes empty passwords
func EnsureAdmin(db *gorm.DB) {
	var admin model.Admin
	result := db.Where("username = ?", "admin").First(&admin)
	if result.Error != nil {
		// No admin exists, create one
		admin = model.Admin{
			Username: "admin",
			Password: hashPassword("admin123"),
		}
		db.Create(&admin)
		fmt.Println("Default admin created: username=admin, password=admin123")
	} else if admin.Password == "" {
		// Admin exists but password column is empty (migrated from old schema)
		db.Model(&admin).Update("password", hashPassword("admin123"))
		fmt.Println("Admin password reset: username=admin, password=admin123")
	}

	// Mark existing videos without uploader as "admin"
	db.Model(&model.Video{}).
		Where("uploaded_by_name IS NULL OR uploaded_by_name = ''").
		Update("uploaded_by_name", "admin")
}
