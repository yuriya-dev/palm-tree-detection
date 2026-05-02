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
		api.POST("/detect", h.Detect)
		api.GET("/detections", h.ListDetections)
		api.GET("/detections/:id", h.GetDetection)
		api.DELETE("/detections/:id", h.DeleteDetection)

		api.GET("/trees", h.ListTrees)
		api.GET("/trees/:id", h.GetTree)
		api.GET("/trees/stats", h.TreeStats)

		api.GET("/datasets", h.ListDatasets)
		api.POST("/datasets", h.CreateDataset)
		api.DELETE("/datasets/:id", h.DeleteDataset)

		api.GET("/models", h.ListModels)
		api.POST("/models/:id/activate", h.ActivateModel)
		api.GET("/models/:id/metrics", h.ModelMetrics)

		api.GET("/analytics/overview", h.AnalyticsOverview)
		api.GET("/analytics/trend", h.AnalyticsTrend)

		api.GET("/health", h.Health)
	}

	return r
}
