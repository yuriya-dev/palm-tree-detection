package domain

type DetectionRequest struct {
	ID                  string  `json:"id"`
	ImageName           string  `json:"image_name"`
	ImagePath           string  `json:"image_path"`
	Site                string  `json:"site"`
	Model               string  `json:"model"`
	ConfidenceThreshold float64 `json:"confidence_threshold"`
	Status              string  `json:"status"` // pending, approved, rejected
	RequestedBy         string  `json:"requested_by,omitempty"`
	ReviewedBy          string  `json:"reviewed_by,omitempty"`
	ReviewNotes         string  `json:"review_notes,omitempty"`
	CreatedAt           string  `json:"created_at"`
	ReviewedAt          string  `json:"reviewed_at,omitempty"`
	PredictionData      string  `json:"prediction_data,omitempty"` // JSON string
}

type DetectionRequestReview struct {
	Action string `json:"action"` // approve, reject
	Notes  string `json:"notes,omitempty"`
}