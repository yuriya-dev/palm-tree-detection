package handler

import (
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"mopad/server/internal/domain"
)

type modelFileItem struct {
	Name string `json:"name"`
	Path string `json:"path"`
}

func (h *Handler) ListModels(c *gin.Context) {
	items, err := h.modelService.ListModels(c.Request.Context())
	if err != nil {
		respondInternalError(c, err)
		return
	}

	respond(c, http.StatusOK, items, "OK", nil)
}

func (h *Handler) ListModelFiles(c *gin.Context) {
	modelsDir := filepath.Join("..", "ml-service", "models")
	entries, err := os.ReadDir(modelsDir)
	if err != nil {
		respondInternalError(c, err)
		return
	}

	items := make([]modelFileItem, 0)
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(strings.ToLower(entry.Name()), ".pt") {
			continue
		}

		items = append(items, modelFileItem{
			Name: entry.Name(),
			Path: filepath.ToSlash(filepath.Join("models", entry.Name())),
		})
	}

	respond(c, http.StatusOK, items, "OK", nil)
}

func (h *Handler) CreateModel(c *gin.Context) {
	file, fileErr := c.FormFile("file")

	name := strings.TrimSpace(c.PostForm("name"))
	site := strings.TrimSpace(c.PostForm("site"))
	status := strings.TrimSpace(c.PostForm("status"))
	accuracy, _ := strconv.ParseFloat(strings.TrimSpace(c.PostForm("accuracy")), 64)
	mapValue, _ := strconv.ParseFloat(strings.TrimSpace(c.PostForm("map")), 64)
	artifactPath := ""

	if fileErr != nil {
		respond(c, http.StatusBadRequest, gin.H{}, "File model .pt wajib diupload", nil)
		return
	}

	filename := filepath.Base(file.Filename)
	if name == "" {
		name = strings.TrimSuffix(filename, filepath.Ext(filename))
	}

	modelsDir := filepath.Join("..", "ml-service", "models")
	if err := os.MkdirAll(modelsDir, 0o755); err != nil {
		respondInternalError(c, err)
		return
	}

	savedPath := filepath.Join(modelsDir, filename)
	if err := c.SaveUploadedFile(file, savedPath); err != nil {
		respondInternalError(c, err)
		return
	}

	artifactPath = filepath.ToSlash(filepath.Join("models", filename))

	payload := domain.Model{
		Name:         name,
		Site:         site,
		Accuracy:     accuracy,
		MAP:          mapValue,
		Status:       status,
		ArtifactPath: artifactPath,
	}

	item, err := h.modelService.CreateModel(c.Request.Context(), payload)
	if err != nil {
		respondInternalError(c, err)
		return
	}

	respond(c, http.StatusCreated, item, "Model created", nil)
}

func (h *Handler) DeleteModel(c *gin.Context) {
	id := c.Param("id")
	deleted, err := h.modelService.DeleteModel(c.Request.Context(), id)
	if err != nil {
		respondInternalError(c, err)
		return
	}
	if !deleted {
		respond(c, http.StatusNotFound, gin.H{}, "Model not found", nil)
		return
	}

	respond(c, http.StatusOK, gin.H{"id": id}, "Model deleted", nil)
}

func (h *Handler) ActivateModel(c *gin.Context) {
	id := c.Param("id")
	item, err := h.modelService.ActivateModel(c.Request.Context(), id)
	if err != nil {
		if isNotFound(err) {
			respond(c, http.StatusNotFound, gin.H{}, "Model not found", nil)
			return
		}

		respondInternalError(c, err)
		return
	}

	respond(c, http.StatusOK, item, "Model activated", nil)
}

func (h *Handler) ModelMetrics(c *gin.Context) {
	id := c.Param("id")
	metrics, err := h.modelService.GetModelMetrics(c.Request.Context(), id)
	if err != nil {
		if isNotFound(err) {
			respond(c, http.StatusNotFound, gin.H{}, "Model not found", nil)
			return
		}

		respondInternalError(c, err)
		return
	}

	respond(c, http.StatusOK, metrics, "OK", nil)
}

func (h *Handler) ExportModel(c *gin.Context) {
	id := c.Param("id")
	modelExport, err := h.modelService.ExportModel(c.Request.Context(), id)
	if err != nil {
		if isNotFound(err) {
			respond(c, http.StatusNotFound, gin.H{}, "Model not found", nil)
			return
		}

		respondInternalError(c, err)
		return
	}

	respond(c, http.StatusOK, modelExport, "OK", nil)
}
