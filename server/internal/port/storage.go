package port

import "context"

type MLPredictRequest struct {
	ImageName           string
	ImageBytes          []byte
	Site                string
	Model               string
	ConfidenceThreshold float64
}

type MLPrediction struct {
	Status     string  `json:"status"`
	Confidence float64 `json:"confidence"`
	Model      string  `json:"model,omitempty"`
	Source     string  `json:"source,omitempty"`
}

type MLRunner interface {
	Predict(ctx context.Context, req MLPredictRequest) (MLPrediction, error)
}
