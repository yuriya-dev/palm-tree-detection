package dto

import "mopad/server/internal/domain"

type DetectionRequestReviewDTO struct {
	Action string `json:"action" binding:"required"` // approve, reject
	Notes  string `json:"notes"`
}

func ToDetectionRequestReview(dto DetectionRequestReviewDTO) domain.DetectionRequestReview {
	return domain.DetectionRequestReview{
		Action: dto.Action,
		Notes:  dto.Notes,
	}
}