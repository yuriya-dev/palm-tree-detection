package dto

type Meta struct {
	Total int `json:"total,omitempty"`
	Page  int `json:"page,omitempty"`
	Limit int `json:"limit,omitempty"`
}

type APIResponse struct {
	Success bool   `json:"success"`
	Data    any    `json:"data"`
	Meta    *Meta  `json:"meta,omitempty"`
	Message string `json:"message"`
}
