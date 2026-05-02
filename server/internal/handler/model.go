package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *Handler) ListModels(c *gin.Context) {
	items, err := h.modelService.ListModels(c.Request.Context())
	if err != nil {
		respondInternalError(c, err)
		return
	}

	respond(c, http.StatusOK, items, "OK", nil)
}

func (h *Handler) ActivateModel(c *gin.Context) {
	id := c.Param("id")
	item, err := h.modelService.ActivateModel(c.Request.Context(), id)
	if err != nil {
		if isNotFound(err) {
			respond(c, http.StatusNotFound, gin.H{}, "Model not found", nil)
			return
		}

		respondInternalError(c, err)
		return
	}

	respond(c, http.StatusOK, item, "Model activated", nil)
}

func (h *Handler) ModelMetrics(c *gin.Context) {
	id := c.Param("id")
	metrics, err := h.modelService.GetModelMetrics(c.Request.Context(), id)
	if err != nil {
		if isNotFound(err) {
			respond(c, http.StatusNotFound, gin.H{}, "Model not found", nil)
			return
		}

		respondInternalError(c, err)
		return
	}

	respond(c, http.StatusOK, metrics, "OK", nil)
}
