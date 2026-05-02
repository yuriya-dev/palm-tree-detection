package port

import (
	"context"

	"mopad/server/internal/domain"
)

type Repository interface {
	Count(ctx context.Context, table string) (int, error)
	MaxIDNumber(ctx context.Context, table, prefix string, fallback int) (int, error)

	CreateDetectionAndTree(ctx context.Context, detection domain.Detection, tree domain.Tree) error
	ListDetections(ctx context.Context, page, limit int) ([]domain.Detection, int, error)
	GetDetectionByID(ctx context.Context, id string) (domain.Detection, error)
	DeleteDetectionByID(ctx context.Context, id string) (bool, error)

	ListTrees(ctx context.Context, site, status string, page, limit int) ([]domain.Tree, int, error)
	GetTreeByID(ctx context.Context, id string) (domain.Tree, error)
	GetTreeStats(ctx context.Context) (domain.TreeStats, error)

	ListDatasets(ctx context.Context, page, limit int) ([]domain.Dataset, int, error)
	CreateDataset(ctx context.Context, dataset domain.Dataset) error
	DeleteDatasetByID(ctx context.Context, id string) (bool, error)

	ListModels(ctx context.Context) ([]domain.Model, error)
	ActivateModel(ctx context.Context, id string) (domain.Model, error)
	GetModelByID(ctx context.Context, id string) (domain.Model, error)
}
