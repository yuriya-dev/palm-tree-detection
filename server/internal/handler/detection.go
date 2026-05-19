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

	// Check if approval is required (default: true)
	requireApproval := c.DefaultPostForm("require_approval", "true") == "true"
	requestedBy := c.DefaultPostForm("requested_by", "user")

	if requireApproval {
		// Create detection request for approval
		detectionReq, err := h.detectionService.CreateDetectionRequest(c.Request.Context(), service.DetectionRequest{
			ImageName:           file.Filename,
			Site:                site,
			Model:               model,
			ConfidenceThreshold: confidenceThreshold,
			ImageBytes:          imageBytes,
		}, requestedBy)
		if err != nil {
			respondInternalError(c, err)
			return
		}

		respond(c, http.StatusAccepted, detectionReq, "Detection request created and pending approval", nil)
		return
	}

	// Direct detection without approval
	result, err := h.detectionService.RunDetection(c.Request.Context(), service.DetectionRequest{
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

	respond(c, http.StatusOK, gin.H{
		"detection":  result.Detection,
		"prediction": result.Prediction,
	}, "Detection completed", nil)
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

// Detection Request handlers

func (h *Handler) ListDetectionRequests(c *gin.Context) {
	status := c.DefaultQuery("status", "pending")
	page, limit := parsePagination(c)
	items, total, err := h.detectionService.ListDetectionRequests(c.Request.Context(), status, page, limit)
	if err != nil {
		respondInternalError(c, err)
		return
	}

	respond(c, http.StatusOK, items, "OK", &dto.Meta{Total: total, Page: page, Limit: limit})
}

func (h *Handler) GetDetectionRequest(c *gin.Context) {
	id := c.Param("id")
	item, err := h.detectionService.GetDetectionRequestByID(c.Request.Context(), id)
	if err != nil {
		if isNotFound(err) {
			respond(c, http.StatusNotFound, gin.H{}, "Detection request not found", nil)
			return
		}

		respondInternalError(c, err)
		return
	}

	respond(c, http.StatusOK, item, "OK", nil)
}

func (h *Handler) ReviewDetectionRequest(c *gin.Context) {
	id := c.Param("id")

	var review dto.DetectionRequestReviewDTO
	if err := c.ShouldBindJSON(&review); err != nil {
		respond(c, http.StatusBadRequest, gin.H{}, "Invalid request body", nil)
		return
	}

	if review.Action != "approve" && review.Action != "reject" {
		respond(c, http.StatusBadRequest, gin.H{}, "Action must be 'approve' or 'reject'", nil)
		return
	}

	reviewedBy := c.DefaultPostForm("reviewed_by", "admin")

	domainReview := dto.ToDetectionRequestReview(review)
	outcome, err := h.detectionService.ReviewDetectionRequest(c.Request.Context(), id, domainReview, reviewedBy)
	if err != nil {
		if strings.Contains(err.Error(), "not pending") {
			respond(c, http.StatusBadRequest, gin.H{}, err.Error(), nil)
			return
		}
		respondInternalError(c, err)
		return
	}

	if review.Action == "approve" {
		respond(c, http.StatusOK, gin.H{
			"detection":  outcome.Detection,
			"prediction": outcome.Prediction,
		}, "Detection request approved and processed", nil)
	} else {
		respond(c, http.StatusOK, gin.H{"id": id}, "Detection request rejected", nil)
	}
}

func (h *Handler) DeleteDetectionRequest(c *gin.Context) {
	id := c.Param("id")
	deleted, err := h.detectionService.DeleteDetectionRequestByID(c.Request.Context(), id)
	if err != nil {
		respondInternalError(c, err)
		return
	}
	if !deleted {
		respond(c, http.StatusNotFound, gin.H{}, "Detection request not found", nil)
		return
	}

	respond(c, http.StatusOK, gin.H{"id": id}, "Detection request deleted", nil)
}
