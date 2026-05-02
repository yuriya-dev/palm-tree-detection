package handler

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"mopad/server/internal/dto"
	"mopad/server/internal/service"
)

type Handler struct {
	detectionService *service.DetectionService
	treeService      *service.TreeService
	datasetService   *service.DatasetService
	modelService     *service.ModelService
	analyticsService *service.AnalyticsService
	db               *sql.DB
}

func New(
	detectionService *service.DetectionService,
	treeService *service.TreeService,
	datasetService *service.DatasetService,
	modelService *service.ModelService,
	analyticsService *service.AnalyticsService,
	db *sql.DB,
) *Handler {
	return &Handler{
		detectionService: detectionService,
		treeService:      treeService,
		datasetService:   datasetService,
		modelService:     modelService,
		analyticsService: analyticsService,
		db:               db,
	}
}

func parsePagination(c *gin.Context) (int, int) {
	page := 1
	limit := 20

	if parsedPage, err := strconv.Atoi(c.DefaultQuery("page", "1")); err == nil && parsedPage > 0 {
		page = parsedPage
	}

	if parsedLimit, err := strconv.Atoi(c.DefaultQuery("limit", "20")); err == nil && parsedLimit > 0 {
		if parsedLimit > 100 {
			parsedLimit = 100
		}
		limit = parsedLimit
	}

	return page, limit
}

func respond(c *gin.Context, statusCode int, data any, message string, meta *dto.Meta) {
	response := dto.APIResponse{
		Success: statusCode >= 200 && statusCode < 400,
		Data:    data,
		Meta:    meta,
		Message: message,
	}

	c.JSON(statusCode, response)
}

func respondInternalError(c *gin.Context, err error) {
	log.Printf("internal server error: %v", err)
	respond(c, http.StatusInternalServerError, gin.H{}, "Internal server error", nil)
}

func isNotFound(err error) bool {
	return errors.Is(err, sql.ErrNoRows)
}

func (h *Handler) Health(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	if err := h.db.PingContext(ctx); err != nil {
		respond(c, http.StatusServiceUnavailable, gin.H{
			"status":    "unhealthy",
			"db":        "disconnected",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		}, "Database connection failed", nil)
		return
	}

	respond(c, http.StatusOK, gin.H{
		"status":    "healthy",
		"db":        "connected",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}, "OK", nil)
}
