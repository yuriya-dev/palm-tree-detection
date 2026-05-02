package handler

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"mopad/server/internal/dto"
)

func (h *Handler) ListDatasets(c *gin.Context) {
	page, limit := parsePagination(c)
	items, total, err := h.datasetService.ListDatasets(c.Request.Context(), page, limit)
	if err != nil {
		respondInternalError(c, err)
		return
	}

	respond(c, http.StatusOK, items, "OK", &dto.Meta{Total: total, Page: page, Limit: limit})
}

func (h *Handler) CreateDataset(c *gin.Context) {
	file, _ := c.FormFile("file")
	name := strings.TrimSpace(c.PostForm("name"))
	if name == "" && file != nil {
		name = file.Filename
	}

	site := c.DefaultPostForm("site", "Site 1")
	item, err := h.datasetService.CreateDataset(c.Request.Context(), name, site)
	if err != nil {
		respondInternalError(c, err)
		return
	}

	respond(c, http.StatusCreated, item, "Dataset created", nil)
}

func (h *Handler) DeleteDataset(c *gin.Context) {
	id := c.Param("id")
	deleted, err := h.datasetService.DeleteDatasetByID(c.Request.Context(), id)
	if err != nil {
		respondInternalError(c, err)
		return
	}
	if !deleted {
		respond(c, http.StatusNotFound, gin.H{}, "Dataset not found", nil)
		return
	}

	respond(c, http.StatusOK, gin.H{"id": id}, "Dataset deleted", nil)
}
