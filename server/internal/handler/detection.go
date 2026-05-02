package handler

import (
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"mopad/server/internal/dto"
	"mopad/server/internal/service"
)

func (h *Handler) Detect(c *gin.Context) {
	file, err := c.FormFile("image")
	if err != nil {
		respond(c, http.StatusBadRequest, gin.H{}, "image file is required", nil)
		return
	}

	fileReader, err := file.Open()
	if err != nil {
		respond(c, http.StatusBadRequest, gin.H{}, "unable to open image file", nil)
		return
	}
	defer fileReader.Close()

	imageBytes, err := io.ReadAll(fileReader)
	if err != nil {
		respond(c, http.StatusBadRequest, gin.H{}, "unable to read image file", nil)
		return
	}

	site := c.DefaultPostForm("site", "Site 1")
	model := c.DefaultPostForm("model", "mopad")
	confidenceThreshold := 0.55
	if rawThreshold := strings.TrimSpace(c.PostForm("confidence_threshold")); rawThreshold != "" {
		if parsedThreshold, parseErr := strconv.ParseFloat(rawThreshold, 64); parseErr == nil {
			confidenceThreshold = parsedThreshold
		}
	}

	detection, err := h.detectionService.RunDetection(c.Request.Context(), service.DetectionRequest{
		ImageName:           file.Filename,
		Site:                site,
		Model:               model,
		ConfidenceThreshold: confidenceThreshold,
		ImageBytes:          imageBytes,
	})
	if err != nil {
		respondInternalError(c, err)
		return
	}

	respond(c, http.StatusOK, detection, "Detection completed", nil)
}

func (h *Handler) ListDetections(c *gin.Context) {
	page, limit := parsePagination(c)
	items, total, err := h.detectionService.ListDetections(c.Request.Context(), page, limit)
	if err != nil {
		respondInternalError(c, err)
		return
	}

	respond(c, http.StatusOK, items, "OK", &dto.Meta{Total: total, Page: page, Limit: limit})
}

func (h *Handler) GetDetection(c *gin.Context) {
	id := c.Param("id")
	item, err := h.detectionService.GetDetectionByID(c.Request.Context(), id)
	if err != nil {
		if isNotFound(err) {
			respond(c, http.StatusNotFound, gin.H{}, "Detection not found", nil)
			return
		}

		respondInternalError(c, err)
		return
	}

	respond(c, http.StatusOK, item, "OK", nil)
}

func (h *Handler) DeleteDetection(c *gin.Context) {
	id := c.Param("id")
	deleted, err := h.detectionService.DeleteDetectionByID(c.Request.Context(), id)
	if err != nil {
		respondInternalError(c, err)
		return
	}
	if !deleted {
		respond(c, http.StatusNotFound, gin.H{}, "Detection not found", nil)
		return
	}

	respond(c, http.StatusOK, gin.H{"id": id}, "Detection deleted", nil)
}
