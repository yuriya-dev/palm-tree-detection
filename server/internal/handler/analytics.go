package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *Handler) AnalyticsOverview(c *gin.Context) {
	overview, err := h.analyticsService.Overview(c.Request.Context())
	if err != nil {
		respondInternalError(c, err)
		return
	}

	respond(c, http.StatusOK, overview, "OK", nil)
}

func (h *Handler) AnalyticsTrend(c *gin.Context) {
	period := c.DefaultQuery("period", "weekly")
	trend := h.analyticsService.Trend(period)
	respond(c, http.StatusOK, trend, "OK", nil)
}
