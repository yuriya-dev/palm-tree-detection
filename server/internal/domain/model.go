package domain

type Model struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Site     string  `json:"site"`
	Accuracy float64 `json:"accuracy"`
	MAP      float64 `json:"map"`
	Status   string  `json:"status"`
}

type ModelMetrics struct {
	ModelID   string    `json:"model_id"`
	Accuracy  float64   `json:"accuracy"`
	MAP       float64   `json:"map"`
	Precision []float64 `json:"precision"`
	Recall    []float64 `json:"recall"`
}
