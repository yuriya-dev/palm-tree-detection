package handler

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"mopad/server/internal/dto"
)

func (h *Handler) ListTrees(c *gin.Context) {
	page, limit := parsePagination(c)
	site := strings.TrimSpace(c.Query("site"))
	status := strings.TrimSpace(c.Query("status"))

	items, total, err := h.treeService.ListTrees(c.Request.Context(), site, status, page, limit)
	if err != nil {
		respondInternalError(c, err)
		return
	}

	respond(c, http.StatusOK, items, "OK", &dto.Meta{Total: total, Page: page, Limit: limit})
}

func (h *Handler) GetTree(c *gin.Context) {
	id := c.Param("id")
	item, err := h.treeService.GetTreeByID(c.Request.Context(), id)
	if err != nil {
		if isNotFound(err) {
			respond(c, http.StatusNotFound, gin.H{}, "Tree not found", nil)
			return
		}

		respondInternalError(c, err)
		return
	}

	respond(c, http.StatusOK, item, "OK", nil)
}

func (h *Handler) TreeStats(c *gin.Context) {
	stats, err := h.treeService.Stats(c.Request.Context())
	if err != nil {
		respondInternalError(c, err)
		return
	}

	respond(c, http.StatusOK, stats, "OK", nil)
}
