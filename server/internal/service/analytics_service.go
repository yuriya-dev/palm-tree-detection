package service

import (
	"context"

	"mopad/server/internal/domain"
	"mopad/server/internal/port"
)

type AnalyticsService struct {
	repo port.Repository
}

func NewAnalyticsService(repo port.Repository) *AnalyticsService {
	return &AnalyticsService{repo: repo}
}

func (s *AnalyticsService) Overview(ctx context.Context) (domain.AnalyticsOverview, error) {
	stats, err := s.repo.GetTreeStats(ctx)
	if err != nil {
		return domain.AnalyticsOverview{}, err
	}

	return domain.AnalyticsOverview{
		TotalTreesDetected:    stats.Total,
		HealthyTrees:          stats.Healthy,
		TreesNeedingAttention: stats.Warning + stats.Critical,
		AreaCoverageHA:        384.5,
	}, nil
}

func (s *AnalyticsService) Trend(period string) domain.AnalyticsTrend {
	if period == "" {
		period = "weekly"
	}

	return domain.AnalyticsTrend{
		Period: period,
		Points: []domain.TrendPoint{
			{Label: "W1", Value: 212},
			{Label: "W2", Value: 238},
			{Label: "W3", Value: 246},
			{Label: "W4", Value: 271},
			{Label: "W5", Value: 289},
		},
	}
}
