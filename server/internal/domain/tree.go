package domain

type Tree struct {
	ID         string  `json:"id"`
	Site       string  `json:"site"`
	Lat        float64 `json:"lat"`
	Lng        float64 `json:"lng"`
	Status     string  `json:"status"`
	Confidence float64 `json:"confidence"`
	DetectedAt string  `json:"detected_at"`
}

type TreeStats struct {
	Total    int `json:"total"`
	Healthy  int `json:"healthy"`
	Warning  int `json:"warning"`
	Critical int `json:"critical"`
}
