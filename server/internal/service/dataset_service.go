package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"mopad/server/internal/domain"
	"mopad/server/internal/port"
)

type DatasetService struct {
	repo port.Repository
}

func NewDatasetService(repo port.Repository) *DatasetService {
	return &DatasetService{repo: repo}
}

func (s *DatasetService) ListDatasets(ctx context.Context, page, limit int) ([]domain.Dataset, int, error) {
	return s.repo.ListDatasets(ctx, page, limit)
}

func (s *DatasetService) CreateDataset(ctx context.Context, name, site string) (domain.Dataset, error) {
	name = strings.TrimSpace(name)
	if strings.TrimSpace(site) == "" {
		site = "Site 1"
	}

	nextIDNumber, err := s.repo.MaxIDNumber(ctx, "datasets", "DS-", 0)
	if err != nil {
		return domain.Dataset{}, err
	}

	if name == "" {
		name = fmt.Sprintf("Dataset %d", nextIDNumber+1)
	}

	total, err := s.repo.Count(ctx, "datasets")
	if err != nil {
		return domain.Dataset{}, err
	}

	dataset := domain.Dataset{
		ID:          fmt.Sprintf("DS-%03d", nextIDNumber+1),
		Name:        name,
		Site:        site,
		ImageCount:  1000 + total*120,
		Annotations: 5000 + total*220,
		Format:      "COCO",
		CreatedAt:   time.Now().UTC().Format(time.RFC3339),
	}

	if err := s.repo.CreateDataset(ctx, dataset); err != nil {
		return domain.Dataset{}, err
	}

	return dataset, nil
}

func (s *DatasetService) DeleteDatasetByID(ctx context.Context, id string) (bool, error) {
	return s.repo.DeleteDatasetByID(ctx, id)
}
