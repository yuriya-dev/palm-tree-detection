package service

import (
	"context"

	"mopad/server/internal/domain"
	"mopad/server/internal/port"
)

type TreeService struct {
	repo port.Repository
}

func NewTreeService(repo port.Repository) *TreeService {
	return &TreeService{repo: repo}
}

func (s *TreeService) ListTrees(ctx context.Context, site, status string, page, limit int) ([]domain.Tree, int, error) {
	return s.repo.ListTrees(ctx, site, status, page, limit)
}

func (s *TreeService) GetTreeByID(ctx context.Context, id string) (domain.Tree, error) {
	return s.repo.GetTreeByID(ctx, id)
}

func (s *TreeService) Stats(ctx context.Context) (domain.TreeStats, error) {
	return s.repo.GetTreeStats(ctx)
}
