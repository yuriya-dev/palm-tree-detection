package repository

import (
	"context"
	"database/sql"
	"fmt"
	"regexp"
	"strings"
	"time"

	"mopad/server/internal/domain"
)

type PostgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

func (r *PostgresRepository) Count(ctx context.Context, table string) (int, error) {
	query, err := countQueryForTable(table)
	if err != nil {
		return 0, err
	}

	var total int
	if err := r.db.QueryRowContext(ctx, query).Scan(&total); err != nil {
		return 0, err
	}

	return total, nil
}

func (r *PostgresRepository) MaxIDNumber(ctx context.Context, table, prefix string, fallback int) (int, error) {
	if table != "trees" && table != "datasets" {
		return 0, fmt.Errorf("table %s does not support prefixed IDs", table)
	}

	startPosition := len(prefix) + 1
	pattern := fmt.Sprintf("^%s[0-9]+$", regexp.QuoteMeta(prefix))
	query := fmt.Sprintf(
		`SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM %d) AS INTEGER)), %d)
		 FROM %s
		 WHERE id ~ $1`,
		startPosition,
		fallback,
		table,
	)

	var maxID int
	if err := r.db.QueryRowContext(ctx, query, pattern).Scan(&maxID); err != nil {
		return 0, err
	}

	return maxID, nil
}

func (r *PostgresRepository) CreateDetectionAndTree(ctx context.Context, detection domain.Detection, tree domain.Tree) error {
	createdAt, err := time.Parse(time.RFC3339, detection.CreatedAt)
	if err != nil {
		createdAt = time.Now().UTC()
	}

	detectedAt, err := time.Parse("2006-01-02", tree.DetectedAt)
	if err != nil {
		return err
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	if _, err := tx.ExecContext(
		ctx,
		`INSERT INTO detections (id, tree_id, site, status, confidence, image_name, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		detection.ID,
		detection.TreeID,
		detection.Site,
		detection.Status,
		detection.Confidence,
		detection.ImageName,
		createdAt,
	); err != nil {
		_ = tx.Rollback()
		return err
	}

	if _, err := tx.ExecContext(
		ctx,
		`INSERT INTO trees (id, site, lat, lng, status, confidence, detected_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		tree.ID,
		tree.Site,
		tree.Lat,
		tree.Lng,
		tree.Status,
		tree.Confidence,
		detectedAt,
	); err != nil {
		_ = tx.Rollback()
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	return nil
}

func (r *PostgresRepository) ListDetections(ctx context.Context, page, limit int) ([]domain.Detection, int, error) {
	total, err := r.Count(ctx, "detections")
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	rows, err := r.db.QueryContext(
		ctx,
		`SELECT id, tree_id, site, status, confidence, image_name, created_at
		 FROM detections
		 ORDER BY created_at DESC
		 LIMIT $1 OFFSET $2`,
		limit,
		offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	items := make([]domain.Detection, 0, limit)
	for rows.Next() {
		var item domain.Detection
		var createdAt time.Time
		if err := rows.Scan(
			&item.ID,
			&item.TreeID,
			&item.Site,
			&item.Status,
			&item.Confidence,
			&item.ImageName,
			&createdAt,
		); err != nil {
			return nil, 0, err
		}

		item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *PostgresRepository) GetDetectionByID(ctx context.Context, id string) (domain.Detection, error) {
	var item domain.Detection
	var createdAt time.Time

	err := r.db.QueryRowContext(
		ctx,
		`SELECT id, tree_id, site, status, confidence, image_name, created_at
		 FROM detections
		 WHERE id = $1`,
		id,
	).Scan(
		&item.ID,
		&item.TreeID,
		&item.Site,
		&item.Status,
		&item.Confidence,
		&item.ImageName,
		&createdAt,
	)
	if err != nil {
		return domain.Detection{}, err
	}

	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	return item, nil
}

func (r *PostgresRepository) DeleteDetectionByID(ctx context.Context, id string) (bool, error) {
	result, err := r.db.ExecContext(ctx, `DELETE FROM detections WHERE id = $1`, id)
	if err != nil {
		return false, err
	}

	affectedRows, err := result.RowsAffected()
	if err != nil {
		return false, err
	}

	return affectedRows > 0, nil
}

func (r *PostgresRepository) ListTrees(ctx context.Context, site, status string, page, limit int) ([]domain.Tree, int, error) {
	site = strings.TrimSpace(site)
	status = strings.TrimSpace(status)
	if strings.EqualFold(site, "all") {
		site = ""
	}
	if strings.EqualFold(status, "all") {
		status = ""
	}

	conditions := make([]string, 0, 2)
	args := make([]any, 0, 4)

	if site != "" {
		args = append(args, site)
		conditions = append(conditions, fmt.Sprintf("site ILIKE $%d", len(args)))
	}

	if status != "" {
		args = append(args, status)
		conditions = append(conditions, fmt.Sprintf("status ILIKE $%d", len(args)))
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = " WHERE " + strings.Join(conditions, " AND ")
	}

	countQuery := "SELECT COUNT(*) FROM trees" + whereClause
	var total int
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	pagedArgs := append(append([]any{}, args...), limit, offset)
	query := fmt.Sprintf(
		`SELECT id, site, lat, lng, status, confidence, detected_at
		 FROM trees%s
		 ORDER BY detected_at DESC, id DESC
		 LIMIT $%d OFFSET $%d`,
		whereClause,
		len(args)+1,
		len(args)+2,
	)

	rows, err := r.db.QueryContext(ctx, query, pagedArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	items := make([]domain.Tree, 0, limit)
	for rows.Next() {
		var item domain.Tree
		var detectedAt time.Time
		if err := rows.Scan(
			&item.ID,
			&item.Site,
			&item.Lat,
			&item.Lng,
			&item.Status,
			&item.Confidence,
			&detectedAt,
		); err != nil {
			return nil, 0, err
		}

		item.DetectedAt = detectedAt.UTC().Format("2006-01-02")
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *PostgresRepository) GetTreeByID(ctx context.Context, id string) (domain.Tree, error) {
	var item domain.Tree
	var detectedAt time.Time
	if err := r.db.QueryRowContext(
		ctx,
		`SELECT id, site, lat, lng, status, confidence, detected_at
		 FROM trees
		 WHERE id = $1`,
		id,
	).Scan(
		&item.ID,
		&item.Site,
		&item.Lat,
		&item.Lng,
		&item.Status,
		&item.Confidence,
		&detectedAt,
	); err != nil {
		return domain.Tree{}, err
	}

	item.DetectedAt = detectedAt.UTC().Format("2006-01-02")
	return item, nil
}

func (r *PostgresRepository) GetTreeStats(ctx context.Context) (domain.TreeStats, error) {
	var stats domain.TreeStats
	err := r.db.QueryRowContext(
		ctx,
		`SELECT
			COUNT(*) AS total,
			COUNT(*) FILTER (WHERE status ILIKE 'Healthy') AS healthy,
			COUNT(*) FILTER (WHERE status ILIKE 'Warning') AS warning,
			COUNT(*) FILTER (WHERE status ILIKE 'Critical') AS critical
		 FROM trees`,
	).Scan(&stats.Total, &stats.Healthy, &stats.Warning, &stats.Critical)
	if err != nil {
		return domain.TreeStats{}, err
	}

	return stats, nil
}

func (r *PostgresRepository) ListDatasets(ctx context.Context, page, limit int) ([]domain.Dataset, int, error) {
	total, err := r.Count(ctx, "datasets")
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	rows, err := r.db.QueryContext(
		ctx,
		`SELECT id, name, site, image_count, annotations, format, created_at
		 FROM datasets
		 ORDER BY created_at DESC
		 LIMIT $1 OFFSET $2`,
		limit,
		offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	items := make([]domain.Dataset, 0, limit)
	for rows.Next() {
		var item domain.Dataset
		var createdAt time.Time
		if err := rows.Scan(
			&item.ID,
			&item.Name,
			&item.Site,
			&item.ImageCount,
			&item.Annotations,
			&item.Format,
			&createdAt,
		); err != nil {
			return nil, 0, err
		}

		item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *PostgresRepository) CreateDataset(ctx context.Context, dataset domain.Dataset) error {
	createdAt, err := time.Parse(time.RFC3339, dataset.CreatedAt)
	if err != nil {
		createdAt = time.Now().UTC()
	}

	_, err = r.db.ExecContext(
		ctx,
		`INSERT INTO datasets (id, name, site, image_count, annotations, format, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		dataset.ID,
		dataset.Name,
		dataset.Site,
		dataset.ImageCount,
		dataset.Annotations,
		dataset.Format,
		createdAt,
	)
	return err
}

func (r *PostgresRepository) DeleteDatasetByID(ctx context.Context, id string) (bool, error) {
	result, err := r.db.ExecContext(ctx, `DELETE FROM datasets WHERE id = $1`, id)
	if err != nil {
		return false, err
	}

	affectedRows, err := result.RowsAffected()
	if err != nil {
		return false, err
	}

	return affectedRows > 0, nil
}

func (r *PostgresRepository) ListModels(ctx context.Context) ([]domain.Model, error) {
	rows, err := r.db.QueryContext(
		ctx,
		`SELECT id, name, site, accuracy, m_ap, status
		 FROM models
		 ORDER BY
			CASE status
				WHEN 'Active' THEN 0
				WHEN 'Training' THEN 1
				ELSE 2
			END,
			id`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]domain.Model, 0)
	for rows.Next() {
		var item domain.Model
		if err := rows.Scan(&item.ID, &item.Name, &item.Site, &item.Accuracy, &item.MAP, &item.Status); err != nil {
			return nil, err
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func (r *PostgresRepository) ActivateModel(ctx context.Context, id string) (domain.Model, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return domain.Model{}, err
	}

	result, err := tx.ExecContext(ctx, `UPDATE models SET status = 'Active' WHERE id = $1`, id)
	if err != nil {
		_ = tx.Rollback()
		return domain.Model{}, err
	}

	affectedRows, err := result.RowsAffected()
	if err != nil {
		_ = tx.Rollback()
		return domain.Model{}, err
	}
	if affectedRows == 0 {
		_ = tx.Rollback()
		return domain.Model{}, sql.ErrNoRows
	}

	if _, err := tx.ExecContext(
		ctx,
		`UPDATE models
		 SET status = 'Inactive'
		 WHERE id <> $1 AND status <> 'Training'`,
		id,
	); err != nil {
		_ = tx.Rollback()
		return domain.Model{}, err
	}

	var model domain.Model
	if err := tx.QueryRowContext(
		ctx,
		`SELECT id, name, site, accuracy, m_ap, status
		 FROM models
		 WHERE id = $1`,
		id,
	).Scan(&model.ID, &model.Name, &model.Site, &model.Accuracy, &model.MAP, &model.Status); err != nil {
		_ = tx.Rollback()
		return domain.Model{}, err
	}

	if err := tx.Commit(); err != nil {
		return domain.Model{}, err
	}

	return model, nil
}

func (r *PostgresRepository) GetModelByID(ctx context.Context, id string) (domain.Model, error) {
	var model domain.Model
	if err := r.db.QueryRowContext(
		ctx,
		`SELECT id, name, site, accuracy, m_ap, status
		 FROM models
		 WHERE id = $1`,
		id,
	).Scan(&model.ID, &model.Name, &model.Site, &model.Accuracy, &model.MAP, &model.Status); err != nil {
		return domain.Model{}, err
	}

	return model, nil
}

func countQueryForTable(table string) (string, error) {
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
