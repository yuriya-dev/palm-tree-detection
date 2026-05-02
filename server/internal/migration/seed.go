package migration

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

func Seed(ctx context.Context, db *sql.DB) error {
	if err := seedTrees(ctx, db); err != nil {
		return err
	}

	if err := seedDetections(ctx, db); err != nil {
		return err
	}

	if err := seedDatasets(ctx, db); err != nil {
		return err
	}

	if err := seedModels(ctx, db); err != nil {
		return err
	}

	return nil
}

func seedTrees(ctx context.Context, db *sql.DB) error {
	total, err := countAll(ctx, db, "trees")
	if err != nil || total > 0 {
		return err
	}

	trees := []struct {
		id         string
		site       string
		lat        float64
		lng        float64
		status     string
		confidence float64
		detectedAt string
	}{
		{id: "TREE-0091", site: "Site 1", lat: -2.261011, lng: 113.91121, status: "Healthy", confidence: 0.94, detectedAt: "2026-04-19"},
		{id: "TREE-0088", site: "Site 2", lat: -2.24822, lng: 113.88973, status: "Warning", confidence: 0.87, detectedAt: "2026-04-19"},
		{id: "TREE-0086", site: "Site 1", lat: -2.27271, lng: 113.93413, status: "Critical", confidence: 0.83, detectedAt: "2026-04-18"},
		{id: "TREE-0084", site: "Site 3", lat: -2.25611, lng: 113.90212, status: "Healthy", confidence: 0.92, detectedAt: "2026-04-18"},
	}

	query := `
		INSERT INTO trees (id, site, lat, lng, status, confidence, detected_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (id) DO NOTHING
	`

	for _, tree := range trees {
		detectedAt, err := time.Parse("2006-01-02", tree.detectedAt)
		if err != nil {
			return err
		}

		if _, err := db.ExecContext(
			ctx,
			query,
			tree.id,
			tree.site,
			tree.lat,
			tree.lng,
			tree.status,
			tree.confidence,
			detectedAt,
		); err != nil {
			return err
		}
	}

	return nil
}

func seedDetections(ctx context.Context, db *sql.DB) error {
	total, err := countAll(ctx, db, "detections")
	if err != nil || total > 0 {
		return err
	}

	detections := []struct {
		id         string
		treeID     string
		site       string
		status     string
		confidence float64
		imageName  string
		createdAt  string
	}{
		{id: "DET-1129", treeID: "TREE-0091", site: "Site 1", status: "Healthy", confidence: 0.94, imageName: "site1-2026-04-19.jpg", createdAt: "2026-04-19T09:14:00Z"},
		{id: "DET-1128", treeID: "TREE-0088", site: "Site 2", status: "Warning", confidence: 0.87, imageName: "site2-2026-04-19.jpg", createdAt: "2026-04-19T08:48:00Z"},
		{id: "DET-1127", treeID: "TREE-0086", site: "Site 1", status: "Critical", confidence: 0.83, imageName: "site1-2026-04-18.jpg", createdAt: "2026-04-18T17:32:00Z"},
	}

	query := `
		INSERT INTO detections (id, tree_id, site, status, confidence, image_name, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (id) DO NOTHING
	`

	for _, detection := range detections {
		createdAt, err := time.Parse(time.RFC3339, detection.createdAt)
		if err != nil {
			return err
		}

		if _, err := db.ExecContext(
			ctx,
			query,
			detection.id,
			detection.treeID,
			detection.site,
			detection.status,
			detection.confidence,
			detection.imageName,
			createdAt,
		); err != nil {
			return err
		}
	}

	return nil
}

func seedDatasets(ctx context.Context, db *sql.DB) error {
	total, err := countAll(ctx, db, "datasets")
	if err != nil || total > 0 {
		return err
	}

	datasets := []struct {
		id          string
		name        string
		site        string
		imageCount  int
		annotations int
		format      string
		createdAt   string
	}{
		{id: "DS-001", name: "Site 1 Baseline", site: "Site 1", imageCount: 2140, annotations: 11621, format: "COCO", createdAt: "2026-04-01T08:30:00Z"},
		{id: "DS-002", name: "Site 2 Season Dry", site: "Site 2", imageCount: 1890, annotations: 9744, format: "COCO", createdAt: "2026-04-03T10:05:00Z"},
	}

	query := `
		INSERT INTO datasets (id, name, site, image_count, annotations, format, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (id) DO NOTHING
	`

	for _, dataset := range datasets {
		createdAt, err := time.Parse(time.RFC3339, dataset.createdAt)
		if err != nil {
			return err
		}

		if _, err := db.ExecContext(
			ctx,
			query,
			dataset.id,
			dataset.name,
			dataset.site,
			dataset.imageCount,
			dataset.annotations,
			dataset.format,
			createdAt,
		); err != nil {
			return err
		}
	}

	return nil
}

func seedModels(ctx context.Context, db *sql.DB) error {
	total, err := countAll(ctx, db, "models")
	if err != nil || total > 0 {
		return err
	}

	models := []struct {
		id       string
		name     string
		site     string
		accuracy float64
		modelMAP float64
		status   string
	}{
		{id: "MOD-S1-V4", name: "PalmNet Site 1", site: "Site 1", accuracy: 95.2, modelMAP: 0.78, status: "Active"},
		{id: "MOD-S2-V3", name: "PalmNet Site 2", site: "Site 2", accuracy: 93.9, modelMAP: 0.74, status: "Training"},
		{id: "MOD-GLOBAL-V2", name: "PalmNet Global", site: "Multi Site", accuracy: 92.1, modelMAP: 0.70, status: "Inactive"},
	}

	query := `
		INSERT INTO models (id, name, site, accuracy, m_ap, status)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (id) DO NOTHING
	`

	for _, model := range models {
		if _, err := db.ExecContext(
			ctx,
			query,
			model.id,
			model.name,
			model.site,
			model.accuracy,
			model.modelMAP,
			model.status,
		); err != nil {
			return err
		}
	}

	return nil
}

func countAll(ctx context.Context, db *sql.DB, table string) (int, error) {
	query, err := countQuery(table)
	if err != nil {
		return 0, err
	}

	var total int
	if err := db.QueryRowContext(ctx, query).Scan(&total); err != nil {
		return 0, err
	}

	return total, nil
}

func countQuery(table string) (string, error) {
	switch table {
	case "detections":
		return "SELECT COUNT(*) FROM detections", nil
	case "trees":
		return "SELECT COUNT(*) FROM trees", nil
	case "datasets":
		return "SELECT COUNT(*) FROM datasets", nil
	case "models":
		return "SELECT COUNT(*) FROM models", nil
	default:
		return "", fmt.Errorf("unsupported table: %s", table)
	}
}
