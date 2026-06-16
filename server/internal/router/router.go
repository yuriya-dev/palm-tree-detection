package router

import (
	"github.com/gin-gonic/gin"

	"mopad/server/internal/handler"
	"mopad/server/internal/middleware"
	"mopad/server/pkg/config"
)

func NewRouter(cfg config.Config, h *handler.Handler) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery(), middleware.RequestLogger(), middleware.CORS(cfg.AllowedOrigins))

	api := r.Group("/api/v1")
	{
		// ── Public routes (no auth) ──────────────────────────────────────────
		api.POST("/auth/login", h.Login)
		api.GET("/health", h.Health)

		// ── Protected routes (Bearer JWT required) ───────────────────────────
		protected := api.Group("/")
		protected.Use(middleware.RequireAuth(cfg.JWTSecret))
		{
			// Auth
			protected.GET("/auth/me", h.Me)

			// Detections
			protected.POST("/detect", h.Detect)
			protected.GET("/detections", h.ListDetections)
			protected.GET("/detections/:id", h.GetDetection)
			protected.DELETE("/detections/:id", h.DeleteDetection)

			// Detection Requests (approval workflow)
			protected.GET("/detection-requests", h.ListDetectionRequests)
			protected.GET("/detection-requests/:id", h.GetDetectionRequest)
			protected.POST("/detection-requests/:id/review", h.ReviewDetectionRequest)
			protected.DELETE("/detection-requests/:id", h.DeleteDetectionRequest)

			// Trees
			protected.GET("/trees", h.ListTrees)
			protected.GET("/trees/:id", h.GetTree)
			protected.GET("/trees/stats", h.TreeStats)

			// Datasets
			protected.GET("/datasets", h.ListDatasets)
			protected.POST("/datasets", h.CreateDataset)
			protected.DELETE("/datasets/:id", h.DeleteDataset)

			// Models
			protected.GET("/models", h.ListModels)
			protected.GET("/models/files", h.ListModelFiles)
			protected.POST("/models", h.CreateModel)
			protected.DELETE("/models/:id", h.DeleteModel)
			protected.POST("/models/:id/activate", h.ActivateModel)
			protected.GET("/models/:id/metrics", h.ModelMetrics)
			protected.GET("/models/:id/export", h.ExportModel)

			// Analytics
			protected.GET("/analytics/overview", h.AnalyticsOverview)
			protected.GET("/analytics/trend", h.AnalyticsTrend)
		}
	}

	return r
}
