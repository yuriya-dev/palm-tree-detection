package port

import "context"

type MLPredictRequest struct {
	ImageName           string
	ImageBytes          []byte
	Site                string
	Model               string
	ConfidenceThreshold float64
}

type MLDetectionBox struct {
	Label     string             `json:"label"`
	Status    string             `json:"status"`
	Confidence float64           `json:"confidence"`
	ClassID   *int               `json:"class_id,omitempty"`
	Box       map[string]float64 `json:"box"`
}

type MLPrediction struct {
	Status             string           `json:"status"`
	Confidence         float64          `json:"confidence"`
	Model              string           `json:"model,omitempty"`
	Source             string           `json:"source,omitempty"`
	Site               string           `json:"site,omitempty"`
	ImageName          string           `json:"image_name,omitempty"`
	ConfidenceThreshold float64         `json:"confidence_threshold,omitempty"`
	ImageSize          map[string]int   `json:"image_size,omitempty"`
	Detections         []MLDetectionBox `json:"detections,omitempty"`
}

type MLRunner interface {
	Predict(ctx context.Context, req MLPredictRequest) (MLPrediction, error)
}
