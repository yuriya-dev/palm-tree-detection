package service

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"mopad/server/internal/domain"
	"mopad/server/internal/port"
)

type DetectionRequest struct {
	ImageName           string
	Site                string
	Model               string
	ConfidenceThreshold float64
	ImageBytes          []byte
}

type DetectionOutcome struct {
	Detection  domain.Detection
	Prediction port.MLPrediction
}

type DetectionService struct {
	repo     port.Repository
	mlRunner port.MLRunner
}

func NewDetectionService(repo port.Repository, mlRunner port.MLRunner) *DetectionService {
	return &DetectionService{repo: repo, mlRunner: mlRunner}
}

func (s *DetectionService) CreateDetectionRequest(ctx context.Context, req DetectionRequest, requestedBy string) (domain.DetectionRequest, error) {
	site := strings.TrimSpace(req.Site)
	if site == "" {
		site = "Site 1"
	}

	// Save image to temporary storage
	uploadDir := "uploads/pending"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return domain.DetectionRequest{}, fmt.Errorf("failed to create upload directory: %w", err)
	}

	imagePath := filepath.Join(uploadDir, fmt.Sprintf("%d_%s", time.Now().Unix(), req.ImageName))
	if err := os.WriteFile(imagePath, req.ImageBytes, 0644); err != nil {
		return domain.DetectionRequest{}, fmt.Errorf("failed to save image: %w", err)
	}

	// Run ML prediction for preview
	var predictionData string
	if s.mlRunner != nil && len(req.ImageBytes) > 0 {
		prediction, err := s.mlRunner.Predict(ctx, port.MLPredictRequest{
			ImageName:           req.ImageName,
			ImageBytes:          req.ImageBytes,
			Site:                site,
			Model:               req.Model,
			ConfidenceThreshold: req.ConfidenceThreshold,
		})
		if err == nil {
			if jsonBytes, err := json.Marshal(prediction); err == nil {
				predictionData = string(jsonBytes)
			}
		}
	}

	detectionReqID := fmt.Sprintf("DREQ-%d", time.Now().Unix()%100000)
	now := time.Now().UTC()

	detectionRequest := domain.DetectionRequest{
		ID:                  detectionReqID,
		ImageName:           req.ImageName,
		ImagePath:           imagePath,
		Site:                site,
		Model:               req.Model,
		ConfidenceThreshold: req.ConfidenceThreshold,
		Status:              "pending",
		RequestedBy:         requestedBy,
		CreatedAt:           now.Format(time.RFC3339),
		PredictionData:      predictionData,
	}

	if err := s.repo.CreateDetectionRequest(ctx, detectionRequest); err != nil {
		return domain.DetectionRequest{}, err
	}

	return detectionRequest, nil
}

func (s *DetectionService) ListDetectionRequests(ctx context.Context, status string, page, limit int) ([]domain.DetectionRequest, int, error) {
	return s.repo.ListDetectionRequests(ctx, status, page, limit)
}

func (s *DetectionService) GetDetectionRequestByID(ctx context.Context, id string) (domain.DetectionRequest, error) {
	return s.repo.GetDetectionRequestByID(ctx, id)
}

func (s *DetectionService) ReviewDetectionRequest(ctx context.Context, id string, review domain.DetectionRequestReview, reviewedBy string) (DetectionOutcome, error) {
	// Get the detection request
	detectionReq, err := s.repo.GetDetectionRequestByID(ctx, id)
	if err != nil {
		return DetectionOutcome{}, err
	}

	if detectionReq.Status != "pending" {
		return DetectionOutcome{}, fmt.Errorf("detection request is not pending")
	}

	// Update status
	var newStatus string
	if review.Action == "approve" {
		newStatus = "approved"
	} else if review.Action == "reject" {
		newStatus = "rejected"
	} else {
		return DetectionOutcome{}, fmt.Errorf("invalid action: %s", review.Action)
	}

	if err := s.repo.UpdateDetectionRequestStatus(ctx, id, newStatus, reviewedBy, review.Notes); err != nil {
		return DetectionOutcome{}, err
	}

	// If approved, create the actual detection
	if newStatus == "approved" {
		// Read the saved image
		imageBytes, err := os.ReadFile(detectionReq.ImagePath)
		if err != nil {
			return DetectionOutcome{}, fmt.Errorf("failed to read saved image: %w", err)
		}

		// Run detection
		outcome, err := s.runDetectionInternal(ctx, DetectionRequest{
			ImageName:           detectionReq.ImageName,
			Site:                detectionReq.Site,
			Model:               detectionReq.Model,
			ConfidenceThreshold: detectionReq.ConfidenceThreshold,
			ImageBytes:          imageBytes,
		})
		if err != nil {
			return DetectionOutcome{}, err
		}

		// Clean up the temporary image
		_ = os.Remove(detectionReq.ImagePath)

		return outcome, nil
	}

	return DetectionOutcome{}, nil
}

func (s *DetectionService) DeleteDetectionRequestByID(ctx context.Context, id string) (bool, error) {
	// Get the detection request to clean up the image
	detectionReq, err := s.repo.GetDetectionRequestByID(ctx, id)
	if err == nil && detectionReq.ImagePath != "" {
		_ = os.Remove(detectionReq.ImagePath)
	}

	return s.repo.DeleteDetectionRequestByID(ctx, id)
}

func (s *DetectionService) RunDetection(ctx context.Context, req DetectionRequest) (DetectionOutcome, error) {
	return s.runDetectionInternal(ctx, req)
}

func (s *DetectionService) runDetectionInternal(ctx context.Context, req DetectionRequest) (DetectionOutcome, error) {
	site := strings.TrimSpace(req.Site)
	if site == "" {
		site = "Site 1"
	}

	detectionCount, err := s.repo.Count(ctx, "detections")
	if err != nil {
		return DetectionOutcome{}, err
	}

	statusOptions := []string{"Healthy", "Warning", "Critical"}
	status := statusOptions[detectionCount%len(statusOptions)]
	confidence := 0.82 + float64(detectionCount%8)*0.02
	var prediction port.MLPrediction

	if s.mlRunner != nil && len(req.ImageBytes) > 0 {
		prediction, _ = s.mlRunner.Predict(ctx, port.MLPredictRequest{
			ImageName:           req.ImageName,
			ImageBytes:          req.ImageBytes,
			Site:                site,
			Model:               req.Model,
			ConfidenceThreshold: req.ConfidenceThreshold,
		})

		if normalizedStatus := normalizeStatus(prediction.Status); normalizedStatus != "" {
			status = normalizedStatus
		}

		if prediction.Confidence > 0 {
			confidence = clampConfidence(prediction.Confidence)
		}

		prediction.ImageName = req.ImageName
		prediction.Site = site
		prediction.ConfidenceThreshold = req.ConfidenceThreshold
		prediction.Model = req.Model
	}

	maxTreeID, err := s.repo.MaxIDNumber(ctx, "trees", "TREE-", 99)
	if err != nil {
		return DetectionOutcome{}, err
	}

	now := time.Now().UTC()

	// If the ML prediction includes multiple detection boxes, persist each as a tree+detection
	if len(prediction.Detections) > 0 {
		created := make([]domain.Detection, 0, len(prediction.Detections))
		for i, box := range prediction.Detections {
			// generate unique sequential tree id
			treeNum := maxTreeID + 1 + i
			treeID := fmt.Sprintf("TREE-%04d", treeNum)
			detectionID := fmt.Sprintf("DET-%d-%d", time.Now().Unix()%100000, i)

			boxStatus := status
			if normalized := normalizeStatus(box.Status); normalized != "" {
				boxStatus = normalized
			}

			boxConfidence := confidence
			if box.Confidence > 0 {
				boxConfidence = clampConfidence(box.Confidence)
			}

			// Calculate center coordinates of bounding box
			cx := 0.0
			cy := 0.0
			if box.Box != nil {
				x1 := box.Box["x1"]
				y1 := box.Box["y1"]
				x2 := box.Box["x2"]
				y2 := box.Box["y2"]
				cx = (x1 + x2) / 2.0
				cy = (y1 + y2) / 2.0
			}

			detection := domain.Detection{
				ID:         detectionID,
				TreeID:     treeID,
				Site:       site,
				Status:     boxStatus,
				Confidence: boxConfidence,
				ImageName:  req.ImageName,
				CreatedAt:  now.Format(time.RFC3339),
			}

			tree := domain.Tree{
				ID:         treeID,
				Site:       site,
				Lng:        104.0 + (cx * 0.00001),
				Lat:        -3.0 - (cy * 0.00001),
				Status:     boxStatus,
				Confidence: detection.Confidence,
				DetectedAt: now.Format("2006-01-02"),
			}

			if err := s.repo.CreateDetectionAndTree(ctx, detection, tree); err != nil {
				return DetectionOutcome{}, err
			}

			created = append(created, detection)
		}

		// return the first created detection along with the prediction
		return DetectionOutcome{Detection: created[0], Prediction: prediction}, nil
	}

	// Fallback: no per-box detections, create a single detection/tree as before
	treeID := fmt.Sprintf("TREE-%04d", maxTreeID+1)
	detectionID := fmt.Sprintf("DET-%d", time.Now().Unix()%100000)

	detection := domain.Detection{
		ID:         detectionID,
		TreeID:     treeID,
		Site:       site,
		Status:     status,
		Confidence: confidence,
		ImageName:  req.ImageName,
		CreatedAt:  now.Format(time.RFC3339),
	}

	cx := 1000.0
	cy := 1000.0
	if prediction.ImageSize != nil {
		if w, ok := prediction.ImageSize["width"]; ok && w > 0 {
			cx = float64(w) / 2.0
		}
		if h, ok := prediction.ImageSize["height"]; ok && h > 0 {
			cy = float64(h) / 2.0
		}
	}

	tree := domain.Tree{
		ID:         treeID,
		Site:       site,
		Lng:        104.0 + (cx * 0.00001),
		Lat:        -3.0 - (cy * 0.00001),
		Status:     status,
		Confidence: detection.Confidence,
		DetectedAt: now.Format("2006-01-02"),
	}

	if err := s.repo.CreateDetectionAndTree(ctx, detection, tree); err != nil {
		return DetectionOutcome{}, err
	}

	return DetectionOutcome{Detection: detection, Prediction: prediction}, nil
}

func normalizeStatus(status string) string {
	switch strings.ToLower(strings.TrimSpace(status)) {
	case "healthy":
		return "Healthy"
	case "warning":
		return "Warning"
	case "critical":
		return "Critical"
	default:
		return ""
	}
}

func clampConfidence(value float64) float64 {
	if value < 0 {
		return 0
	}

	if value > 1 {
		return 1
	}

	return value
}

func (s *DetectionService) ListDetections(ctx context.Context, page, limit int) ([]domain.Detection, int, error) {
	return s.repo.ListDetections(ctx, page, limit)
}

func (s *DetectionService) GetDetectionByID(ctx context.Context, id string) (domain.Detection, error) {
	return s.repo.GetDetectionByID(ctx, id)
}

func (s *DetectionService) DeleteDetectionByID(ctx context.Context, id string) (bool, error) {
	return s.repo.DeleteDetectionByID(ctx, id)
}
