package service

import (
	"context"
	"fmt"
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

type DetectionService struct {
	repo     port.Repository
	mlRunner port.MLRunner
}

func NewDetectionService(repo port.Repository, mlRunner port.MLRunner) *DetectionService {
	return &DetectionService{repo: repo, mlRunner: mlRunner}
}

func (s *DetectionService) RunDetection(ctx context.Context, req DetectionRequest) (domain.Detection, error) {
	site := strings.TrimSpace(req.Site)
	if site == "" {
		site = "Site 1"
	}

	detectionCount, err := s.repo.Count(ctx, "detections")
	if err != nil {
		return domain.Detection{}, err
	}

	statusOptions := []string{"Healthy", "Warning", "Critical"}
	status := statusOptions[detectionCount%len(statusOptions)]
	confidence := 0.82 + float64(detectionCount%8)*0.02

	if s.mlRunner != nil && len(req.ImageBytes) > 0 {
		prediction, predictErr := s.mlRunner.Predict(ctx, port.MLPredictRequest{
			ImageName:           req.ImageName,
			ImageBytes:          req.ImageBytes,
			Site:                site,
			Model:               req.Model,
			ConfidenceThreshold: req.ConfidenceThreshold,
		})

		if predictErr == nil {
			if normalizedStatus := normalizeStatus(prediction.Status); normalizedStatus != "" {
				status = normalizedStatus
			}

			if prediction.Confidence > 0 {
				confidence = clampConfidence(prediction.Confidence)
			}
		}
	}

	maxTreeID, err := s.repo.MaxIDNumber(ctx, "trees", "TREE-", 99)
	if err != nil {
		return domain.Detection{}, err
	}

	treeID := fmt.Sprintf("TREE-%04d", maxTreeID+1)
	detectionID := fmt.Sprintf("DET-%d", time.Now().Unix()%100000)
	now := time.Now().UTC()

	detection := domain.Detection{
		ID:         detectionID,
		TreeID:     treeID,
		Site:       site,
		Status:     status,
		Confidence: confidence,
		ImageName:  req.ImageName,
		CreatedAt:  now.Format(time.RFC3339),
	}

	tree := domain.Tree{
		ID:         treeID,
		Site:       site,
		Lat:        -2.24 - float64(maxTreeID)*0.0011,
		Lng:        113.89 + float64(maxTreeID)*0.0014,
		Status:     status,
		Confidence: detection.Confidence,
		DetectedAt: now.Format("2006-01-02"),
	}

	if err := s.repo.CreateDetectionAndTree(ctx, detection, tree); err != nil {
		return domain.Detection{}, err
	}

	return detection, nil
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
