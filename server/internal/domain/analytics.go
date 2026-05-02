package domain

type AnalyticsOverview struct {
	TotalTreesDetected   int     `json:"total_trees_detected"`
	HealthyTrees         int     `json:"healthy_trees"`
	TreesNeedingAttention int    `json:"trees_needing_attention"`
	AreaCoverageHA       float64 `json:"area_coverage_ha"`
}

type TrendPoint struct {
	Label string `json:"label"`
	Value int    `json:"value"`
}

type AnalyticsTrend struct {
	Period string      `json:"period"`
	Points []TrendPoint `json:"points"`
}
