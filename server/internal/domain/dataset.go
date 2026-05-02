package domain

type Dataset struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Site        string `json:"site"`
	ImageCount  int    `json:"image_count"`
	Annotations int    `json:"annotations"`
	Format      string `json:"format"`
	CreatedAt   string `json:"created_at"`
}
