package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"balili/internal/database"
	"balili/internal/handler"
	"balili/internal/middleware"
	"balili/internal/repository"
	"balili/internal/service"

	"github.com/gin-gonic/gin"
)

func main() {
	port := flag.String("port", "8080", "Server port")
	dbPath := flag.String("db", "./data/balili.db", "SQLite database path")
	flag.Parse()

	if err := database.Init(*dbPath); err != nil {
		log.Fatalf("DB init failed: %v", err)
	}
	db := database.DB

	// Ensure default admin exists
	handler.EnsureAdmin(db)

	// repositories
	videoRepo := repository.NewVideoRepository(db)
	catRepo := repository.NewCategoryRepository(db)
	tagRepo := repository.NewTagRepository(db)
	userRepo := repository.NewUserRepository(db)
	countryRepo := repository.NewCountryRepository(db)

	// services
	videoSvc := service.NewVideoService(videoRepo, catRepo, tagRepo)
	catSvc := service.NewCategoryService(catRepo)
	countrySvc := service.NewCountryService(countryRepo)

	// handlers
	videoHandler := handler.NewVideoHandler(videoSvc, db)
	catHandler := handler.NewCategoryHandler(catSvc)
	tagHandler := handler.NewTagHandler(tagRepo)
	countryHandler := handler.NewCountryHandler(countrySvc)
	statsHandler := handler.NewStatsHandler(db, videoSvc, catSvc)
	adminHandler := handler.NewAdminHandler(videoSvc, catSvc, tagRepo, countrySvc, db)
	adminUserHandler := handler.NewAdminUserHandler(userRepo, db)
	interactionHandler := handler.NewInteractionHandler(db)
	authHandler := handler.NewAuthHandler(db)

	// router
	r := gin.Default()
	r.Use(middleware.CORS())

	// serve uploads
	os.MkdirAll("./uploads", 0755)
	r.Static("/uploads", "./uploads")

	v1 := r.Group("/api/v1")
	{
		// ---- Public video endpoints ----
		v1.GET("/videos", videoHandler.List)
		v1.GET("/videos/random", videoHandler.GetRandom)
		v1.GET("/videos/popular", videoHandler.GetPopular)
		v1.GET("/videos/:id", videoHandler.GetByID)
		v1.GET("/search", videoHandler.Search)

		// categories
		v1.GET("/categories", catHandler.List)
		v1.GET("/categories/:slug", catHandler.GetBySlug)

		// tags
		v1.GET("/tags", tagHandler.List)

		// countries
		v1.GET("/countries", countryHandler.List)

		// stats
		v1.GET("/stats/overview", statsHandler.Overview)

		// ---- Auth endpoints ----
		v1.POST("/auth/register", authHandler.Register)
		v1.POST("/auth/login", authHandler.Login)
		v1.GET("/auth/profile", middleware.AuthRequired(), authHandler.GetProfile)
		v1.GET("/users/:username/videos", authHandler.GetUserVideos)

		// ---- Interaction endpoints (some require auth) ----
		v1.POST("/videos/:id/view", interactionHandler.IncrementView)
		v1.POST("/videos/:id/like", middleware.AuthRequired(), interactionHandler.ToggleLike)
		v1.POST("/videos/:id/vote", middleware.AuthRequired(), interactionHandler.Vote)
		v1.GET("/videos/:id/vote", interactionHandler.GetVoteStatus)
		v1.GET("/videos/trending", interactionHandler.GetTrendingLikes)
		v1.GET("/videos/:id/comments", interactionHandler.ListComments)
		v1.POST("/videos/:id/comments", middleware.AuthRequired(), interactionHandler.CreateComment)

		// ---- User video upload ----
		v1.POST("/videos/upload", middleware.AuthRequired(), authHandler.UploadVideo)

		// ---- Admin auth ----
		v1.POST("/admin/auth/login", authHandler.AdminLogin)

		// ---- Admin (requires admin auth) ----
		admin := v1.Group("/admin")
		admin.Use(middleware.AdminAuthRequired())
		{
			admin.GET("/dashboard", statsHandler.Dashboard)
			admin.GET("/stats/charts", statsHandler.Charts)

			// video management
			admin.GET("/videos", adminHandler.ListVideos)
			admin.GET("/videos/:id", adminHandler.GetVideo)
			admin.POST("/videos", adminHandler.CreateVideo)
			admin.PUT("/videos/:id", adminHandler.UpdateVideo)
			admin.DELETE("/videos/:id", adminHandler.DeleteVideo)
			admin.PUT("/videos/:id/relations", adminHandler.UpdateVideoRelations)

			// category management
			admin.GET("/categories", adminHandler.ListCategories)
			admin.POST("/categories", adminHandler.CreateCategory)
			admin.PUT("/categories/:id", adminHandler.UpdateCategory)
			admin.DELETE("/categories/:id", adminHandler.DeleteCategory)

			// tag management
			admin.GET("/tags", adminHandler.ListTags)
			admin.GET("/tags/:id", adminHandler.GetTag)
			admin.POST("/tags", adminHandler.CreateTag)
			admin.PUT("/tags/:id", adminHandler.UpdateTag)
			admin.DELETE("/tags/:id", adminHandler.DeleteTag)

			// country management
			admin.GET("/countries", adminHandler.ListCountries)
			admin.POST("/countries", adminHandler.CreateCountry)
			admin.PUT("/countries/:id", adminHandler.UpdateCountry)
			admin.DELETE("/countries/:id", adminHandler.DeleteCountry)

			// comment management
			admin.DELETE("/comments/:commentId", interactionHandler.DeleteComment)

			// user management
			admin.GET("/users", adminUserHandler.ListUsers)
			admin.GET("/users/:id", adminUserHandler.GetUser)
			admin.PUT("/users/:id", adminUserHandler.UpdateUser)
			admin.DELETE("/users/:id", adminUserHandler.DeleteUser)
		}
	}

	addr := fmt.Sprintf(":%s", *port)
	fmt.Printf("Balili API Server starting on http://localhost%s\n", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
