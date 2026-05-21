package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"path/filepath"
	"regexp"
	"strings"

	"mopad/server/internal/domain"
	"mopad/server/internal/port"
)

type ModelService struct {
	repo port.Repository
}

func NewModelService(repo port.Repository) *ModelService {
	return &ModelService{repo: repo}
}

func (s *ModelService) ListModels(ctx context.Context) ([]domain.Model, error) {
	return s.repo.ListModels(ctx)
}

func (s *ModelService) CreateModel(ctx context.Context, model domain.Model) (domain.Model, error) {
	model.Name = strings.TrimSpace(model.Name)
	model.Site = strings.TrimSpace(model.Site)
	model.Status = strings.TrimSpace(model.Status)
	model.ArtifactPath = strings.TrimSpace(model.ArtifactPath)

	if model.Name == "" && model.ArtifactPath != "" {
		model.Name = strings.TrimSuffix(filepath.Base(model.ArtifactPath), filepath.Ext(model.ArtifactPath))
	}
	if model.Name == "" {
		model.Name = "New Model"
	}
	if model.Site == "" {
		model.Site = "Site 1"
	}
	if model.Status == "" {
		model.Status = "Inactive"
	}
	if model.ID == "" {
		model.ID = buildModelID(model.Name)
	}
	if model.ArtifactPath == "" {
		model.ArtifactPath = filepath.ToSlash(filepath.Join("models", fmt.Sprintf("%s.pt", strings.TrimSuffix(filepath.Base(model.Name), filepath.Ext(model.Name)))))
	}

	if err := s.repo.CreateModel(ctx, model); err != nil {
		return domain.Model{}, err
	}

	return model, nil
}

func (s *ModelService) ActivateModel(ctx context.Context, id string) (domain.Model, error) {
	return s.repo.ActivateModel(ctx, id)
}

func (s *ModelService) GetModelMetrics(ctx context.Context, id string) (domain.ModelMetrics, error) {
	model, err := s.repo.GetModelByID(ctx, id)
	if err != nil {
		return domain.ModelMetrics{}, err
	}

	return domain.ModelMetrics{
		ModelID:   id,
		Accuracy:  model.Accuracy,
		MAP:       model.MAP,
		Precision: []float64{0.71, 0.78, 0.84, 0.86},
		Recall:    []float64{0.64, 0.70, 0.76, 0.80},
	}, nil
}

func (s *ModelService) ExportModel(ctx context.Context, id string) (domain.ModelExport, error) {
	model, err := s.repo.GetModelByID(ctx, id)
	if err != nil {
		return domain.ModelExport{}, err
	}

	metrics, err := s.GetModelMetrics(ctx, id)
	if err != nil {
		return domain.ModelExport{}, err
	}

	return domain.ModelExport{
		Model:   model,
		Metrics: metrics,
	}, nil
}

func (s *ModelService) DeleteModel(ctx context.Context, id string) (bool, error) {
	return s.repo.DeleteModelByID(ctx, id)
}

func buildModelID(name string) string {
	re := regexp.MustCompile(`[^a-zA-Z0-9]+`)
	slug := strings.Trim(re.ReplaceAllString(strings.ToUpper(name), "-"), "-")
	if slug == "" {
		slug = "MODEL"
	}

	randomBytes := make([]byte, 2)
	if _, err := rand.Read(randomBytes); err != nil {
		return "MOD-" + slug
	}

	return "MOD-" + slug + "-" + strings.ToUpper(hex.EncodeToString(randomBytes))
}
