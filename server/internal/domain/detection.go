package domain

type Detection struct {
	ID         string  `json:"id"`
	TreeID     string  `json:"tree_id"`
	Site       string  `json:"site"`
	Status     string  `json:"status"`
	Confidence float64 `json:"confidence"`
	ImageName  string  `json:"image_name"`
	CreatedAt  string  `json:"created_at"`
}
