package service

import (
	"context"

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
