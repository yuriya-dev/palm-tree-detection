package main

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Meta struct {
	Total int `json:"total,omitempty"`
	Page  int `json:"page,omitempty"`
	Limit int `json:"limit,omitempty"`
}

type APIResponse struct {
	Success bool  `json:"success"`
	Data    any   `json:"data"`
	Meta    *Meta `json:"meta,omitempty"`
	Message string `json:"message"`
}

type Detection struct {
	ID         string  `json:"id"`
	TreeID     string  `json:"tree_id"`
	Site       string  `json:"site"`
	Status     string  `json:"status"`
	Confidence float64 `json:"confidence"`
	ImageName  string  `json:"image_name"`
	CreatedAt  string  `json:"created_at"`
}

type Tree struct {
	ID         string  `json:"id"`
	Site       string  `json:"site"`
	Lat        float64 `json:"lat"`
	Lng        float64 `json:"lng"`
	Status     string  `json:"status"`
	Confidence float64 `json:"confidence"`
	DetectedAt string  `json:"detected_at"`
}

type Dataset struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Site        string `json:"site"`
	ImageCount  int    `json:"image_count"`
	Annotations int    `json:"annotations"`
	Format      string `json:"format"`
	CreatedAt   string `json:"created_at"`
}

type Model struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Site     string  `json:"site"`
	Accuracy float64 `json:"accuracy"`
	MAP      float64 `json:"map"`
	Status   string  `json:"status"`
}

type Server struct {
	mu         sync.RWMutex
	detections []Detection
	trees      []Tree
	datasets   []Dataset
	models     []Model
}

func main() {
	server := newServer()
	router := server.buildRouter()

	if err := router.Run(":8080"); err != nil {
		panic(err)
	}
}

func newServer() *Server {
	return &Server{
		detections: []Detection{
			{
				ID:         "DET-1129",
				TreeID:     "TREE-0091",
				Site:       "Site 1",
				Status:     "Healthy",
				Confidence: 0.94,
				ImageName:  "site1-2026-04-19.jpg",
				CreatedAt:  "2026-04-19T09:14:00Z",
			},
			{
				ID:         "DET-1128",
				TreeID:     "TREE-0088",
				Site:       "Site 2",
				Status:     "Warning",
				Confidence: 0.87,
				ImageName:  "site2-2026-04-19.jpg",
				CreatedAt:  "2026-04-19T08:48:00Z",
			},
			{
				ID:         "DET-1127",
				TreeID:     "TREE-0086",
				Site:       "Site 1",
				Status:     "Critical",
				Confidence: 0.83,
				ImageName:  "site1-2026-04-18.jpg",
				CreatedAt:  "2026-04-18T17:32:00Z",
			},
		},
		trees: []Tree{
			{ID: "TREE-0091", Site: "Site 1", Lat: -2.261011, Lng: 113.91121, Status: "Healthy", Confidence: 0.94, DetectedAt: "2026-04-19"},
			{ID: "TREE-0088", Site: "Site 2", Lat: -2.24822, Lng: 113.88973, Status: "Warning", Confidence: 0.87, DetectedAt: "2026-04-19"},
			{ID: "TREE-0086", Site: "Site 1", Lat: -2.27271, Lng: 113.93413, Status: "Critical", Confidence: 0.83, DetectedAt: "2026-04-18"},
			{ID: "TREE-0084", Site: "Site 3", Lat: -2.25611, Lng: 113.90212, Status: "Healthy", Confidence: 0.92, DetectedAt: "2026-04-18"},
		},
		datasets: []Dataset{
			{ID: "DS-001", Name: "Site 1 Baseline", Site: "Site 1", ImageCount: 2140, Annotations: 11621, Format: "COCO", CreatedAt: "2026-04-01T08:30:00Z"},
			{ID: "DS-002", Name: "Site 2 Season Dry", Site: "Site 2", ImageCount: 1890, Annotations: 9744, Format: "COCO", CreatedAt: "2026-04-03T10:05:00Z"},
		},
		models: []Model{
			{ID: "MOD-S1-V4", Name: "PalmNet Site 1", Site: "Site 1", Accuracy: 95.2, MAP: 0.78, Status: "Active"},
			{ID: "MOD-S2-V3", Name: "PalmNet Site 2", Site: "Site 2", Accuracy: 93.9, MAP: 0.74, Status: "Training"},
			{ID: "MOD-GLOBAL-V2", Name: "PalmNet Global", Site: "Multi Site", Accuracy: 92.1, MAP: 0.70, Status: "Inactive"},
		},
	}
}

func (s *Server) buildRouter() *gin.Engine {
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api/v1")
	{
		api.POST("/detect", s.detect)
		api.GET("/detections", s.listDetections)
		api.GET("/detections/:id", s.getDetection)
		api.DELETE("/detections/:id", s.deleteDetection)

		api.GET("/trees", s.listTrees)
		api.GET("/trees/:id", s.getTree)
		api.GET("/trees/stats", s.treeStats)

		api.GET("/datasets", s.listDatasets)
		api.POST("/datasets", s.createDataset)
		api.DELETE("/datasets/:id", s.deleteDataset)

		api.GET("/models", s.listModels)
		api.POST("/models/:id/activate", s.activateModel)
		api.GET("/models/:id/metrics", s.modelMetrics)

		api.GET("/analytics/overview", s.analyticsOverview)
		api.GET("/analytics/trend", s.analyticsTrend)

		api.GET("/health", s.health)
	}

	return r
}

func (s *Server) detect(c *gin.Context) {
	file, err := c.FormFile("image")
	if err != nil {
		respond(c, http.StatusBadRequest, gin.H{}, "image file is required", nil)
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	statusOptions := []string{"Healthy", "Warning", "Critical"}
	status := statusOptions[len(s.detections)%len(statusOptions)]
	treeID := fmt.Sprintf("TREE-%04d", len(s.trees)+100)
	detectionID := fmt.Sprintf("DET-%d", time.Now().Unix()%100000)

	detection := Detection{
		ID:         detectionID,
		TreeID:     treeID,
		Site:       c.DefaultPostForm("site", "Site 1"),
		Status:     status,
		Confidence: 0.82 + float64(len(s.detections)%8)*0.02,
		ImageName:  file.Filename,
		CreatedAt:  time.Now().UTC().Format(time.RFC3339),
	}

	tree := Tree{
		ID:         treeID,
		Site:       detection.Site,
		Lat:        -2.24 - float64(len(s.trees))*0.0011,
		Lng:        113.89 + float64(len(s.trees))*0.0014,
		Status:     status,
		Confidence: detection.Confidence,
		DetectedAt: time.Now().UTC().Format("2006-01-02"),
	}

	s.detections = append([]Detection{detection}, s.detections...)
	s.trees = append([]Tree{tree}, s.trees...)

	respond(c, http.StatusOK, detection, "Detection completed", nil)
}

func (s *Server) listDetections(c *gin.Context) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	page, limit := parsePagination(c)
	items, meta := paginateSlice(s.detections, page, limit)
	respond(c, http.StatusOK, items, "OK", meta)
}

func (s *Server) getDetection(c *gin.Context) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	id := c.Param("id")
	for _, detection := range s.detections {
		if detection.ID == id {
			respond(c, http.StatusOK, detection, "OK", nil)
			return
		}
	}

	respond(c, http.StatusNotFound, gin.H{}, "Detection not found", nil)
}

func (s *Server) deleteDetection(c *gin.Context) {
	s.mu.Lock()
	defer s.mu.Unlock()

	id := c.Param("id")
	for idx, detection := range s.detections {
		if detection.ID == id {
			s.detections = append(s.detections[:idx], s.detections[idx+1:]...)
			respond(c, http.StatusOK, gin.H{"id": id}, "Detection deleted", nil)
			return
		}
	}

	respond(c, http.StatusNotFound, gin.H{}, "Detection not found", nil)
}

func (s *Server) listTrees(c *gin.Context) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	siteFilter := strings.TrimSpace(c.Query("site"))
	statusFilter := strings.TrimSpace(c.Query("status"))

	filtered := make([]Tree, 0, len(s.trees))
	for _, tree := range s.trees {
		siteMatch := siteFilter == "" || strings.EqualFold(tree.Site, siteFilter)
		statusMatch := statusFilter == "" || strings.EqualFold(tree.Status, statusFilter)
		if siteMatch && statusMatch {
			filtered = append(filtered, tree)
		}
	}

	page, limit := parsePagination(c)
	items, meta := paginateSlice(filtered, page, limit)
	respond(c, http.StatusOK, items, "OK", meta)
}

func (s *Server) getTree(c *gin.Context) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	id := c.Param("id")
	for _, tree := range s.trees {
		if tree.ID == id {
			respond(c, http.StatusOK, tree, "OK", nil)
			return
		}
	}

	respond(c, http.StatusNotFound, gin.H{}, "Tree not found", nil)
}

func (s *Server) treeStats(c *gin.Context) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var healthy, warning, critical int
	for _, tree := range s.trees {
		switch tree.Status {
		case "Healthy":
			healthy++
		case "Warning":
			warning++
		case "Critical":
			critical++
		}
	}

	respond(c, http.StatusOK, gin.H{
		"total":    len(s.trees),
		"healthy":  healthy,
		"warning":  warning,
		"critical": critical,
	}, "OK", nil)
}

func (s *Server) listDatasets(c *gin.Context) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	page, limit := parsePagination(c)
	items, meta := paginateSlice(s.datasets, page, limit)
	respond(c, http.StatusOK, items, "OK", meta)
}

func (s *Server) createDataset(c *gin.Context) {
	s.mu.Lock()
	defer s.mu.Unlock()

	file, _ := c.FormFile("file")
	name := c.PostForm("name")
	site := c.DefaultPostForm("site", "Site 1")

	if name == "" && file != nil {
		name = file.Filename
	}
	if name == "" {
		name = fmt.Sprintf("Dataset %d", len(s.datasets)+1)
	}

	dataset := Dataset{
		ID:          fmt.Sprintf("DS-%03d", len(s.datasets)+1),
		Name:        name,
		Site:        site,
		ImageCount:  1000 + len(s.datasets)*120,
		Annotations: 5000 + len(s.datasets)*220,
		Format:      "COCO",
		CreatedAt:   time.Now().UTC().Format(time.RFC3339),
	}

	s.datasets = append([]Dataset{dataset}, s.datasets...)
	respond(c, http.StatusCreated, dataset, "Dataset created", nil)
}

func (s *Server) deleteDataset(c *gin.Context) {
	s.mu.Lock()
	defer s.mu.Unlock()

	id := c.Param("id")
	for idx, dataset := range s.datasets {
		if dataset.ID == id {
			s.datasets = append(s.datasets[:idx], s.datasets[idx+1:]...)
			respond(c, http.StatusOK, gin.H{"id": id}, "Dataset deleted", nil)
			return
		}
	}

	respond(c, http.StatusNotFound, gin.H{}, "Dataset not found", nil)
}

func (s *Server) listModels(c *gin.Context) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	respond(c, http.StatusOK, s.models, "OK", nil)
}

func (s *Server) activateModel(c *gin.Context) {
	s.mu.Lock()
	defer s.mu.Unlock()

	id := c.Param("id")
	var activeModel *Model

	for i := range s.models {
		if s.models[i].ID == id {
			s.models[i].Status = "Active"
			activeModel = &s.models[i]
			continue
		}

		if s.models[i].Status != "Training" {
			s.models[i].Status = "Inactive"
		}
	}

	if activeModel == nil {
		respond(c, http.StatusNotFound, gin.H{}, "Model not found", nil)
		return
	}

	respond(c, http.StatusOK, activeModel, "Model activated", nil)
}

func (s *Server) modelMetrics(c *gin.Context) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	id := c.Param("id")
	for _, model := range s.models {
		if model.ID == id {
			respond(c, http.StatusOK, gin.H{
				"model_id": id,
				"accuracy": model.Accuracy,
				"map":      model.MAP,
				"precision": []float64{0.71, 0.78, 0.84, 0.86},
				"recall":    []float64{0.64, 0.7, 0.76, 0.8},
			}, "OK", nil)
			return
		}
	}

	respond(c, http.StatusNotFound, gin.H{}, "Model not found", nil)
}

func (s *Server) analyticsOverview(c *gin.Context) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	respond(c, http.StatusOK, gin.H{
		"total_trees_detected":   len(s.trees),
		"healthy_trees":          countTreesByStatus(s.trees, "Healthy"),
		"trees_needing_attention": countTreesByStatus(s.trees, "Warning") + countTreesByStatus(s.trees, "Critical"),
		"area_coverage_ha":       384.5,
	}, "OK", nil)
}

func (s *Server) analyticsTrend(c *gin.Context) {
	period := c.DefaultQuery("period", "weekly")
	respond(c, http.StatusOK, gin.H{
		"period": period,
		"points": []gin.H{
			{"label": "W1", "value": 212},
			{"label": "W2", "value": 238},
			{"label": "W3", "value": 246},
			{"label": "W4", "value": 271},
			{"label": "W5", "value": 289},
		},
	}, "OK", nil)
}

func (s *Server) health(c *gin.Context) {
	respond(c, http.StatusOK, gin.H{
		"status":    "healthy",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}, "OK", nil)
}

func parsePagination(c *gin.Context) (int, int) {
	page := 1
	limit := 20

	if parsedPage, err := strconv.Atoi(c.DefaultQuery("page", "1")); err == nil && parsedPage > 0 {
		page = parsedPage
	}

	if parsedLimit, err := strconv.Atoi(c.DefaultQuery("limit", "20")); err == nil && parsedLimit > 0 {
		if parsedLimit > 100 {
			parsedLimit = 100
		}
		limit = parsedLimit
	}

	return page, limit
}

func paginateSlice[T any](items []T, page, limit int) ([]T, *Meta) {
	total := len(items)
	start := (page - 1) * limit
	if start >= total {
		return []T{}, &Meta{Total: total, Page: page, Limit: limit}
	}

	end := start + limit
	if end > total {
		end = total
	}

	return items[start:end], &Meta{Total: total, Page: page, Limit: limit}
}

func countTreesByStatus(trees []Tree, status string) int {
	count := 0
	for _, tree := range trees {
		if strings.EqualFold(tree.Status, status) {
			count++
		}
	}
	return count
}

func respond(c *gin.Context, statusCode int, data any, message string, meta *Meta) {
	response := APIResponse{
		Success: statusCode >= 200 && statusCode < 400,
		Data:    data,
		Meta:    meta,
		Message: message,
	}

	c.JSON(statusCode, response)
}
