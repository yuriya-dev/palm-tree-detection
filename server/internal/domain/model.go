package domain

type Model struct {
	ID           string  `json:"id"`
	Name         string  `json:"name"`
	Site         string  `json:"site"`
	Accuracy     float64 `json:"accuracy"`
	MAP          float64 `json:"map"`
	Status       string  `json:"status"`
	ArtifactPath string  `json:"artifact_path,omitempty"`
}

type ModelMetrics struct {
	ModelID   string    `json:"model_id"`
	Accuracy  float64   `json:"accuracy"`
	MAP       float64   `json:"map"`
	Precision []float64 `json:"precision"`
	Recall    []float64 `json:"recall"`
}

type ModelExport struct {
	Model   Model        `json:"model"`
	Metrics ModelMetrics `json:"metrics"`
}
