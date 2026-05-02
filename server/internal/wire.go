package app

import (
	"context"
	"database/sql"

	"github.com/gin-gonic/gin"

	"mopad/server/internal/database"
	"mopad/server/internal/handler"
	"mopad/server/internal/ml"
	"mopad/server/internal/migration"
	"mopad/server/internal/port"
	"mopad/server/internal/repository"
	httpRouter "mopad/server/internal/router"
	"mopad/server/internal/service"
	"mopad/server/pkg/config"
)

func BuildHTTPRouter(cfg config.Config) (*gin.Engine, func(), error) {
	db, err := database.OpenPostgres(cfg)
	if err != nil {
		return nil, nil, err
	}

	if err := bootstrapDatabase(context.Background(), db); err != nil {
		db.Close()
		return nil, nil, err
	}

	repo := repository.NewPostgresRepository(db)
	var mlRunner port.MLRunner
	if cfg.MLServiceURL != "" {
		mlRunner = ml.NewHTTPRunner(cfg.MLServiceURL)
	}

	detectionService := service.NewDetectionService(repo, mlRunner)
	treeService := service.NewTreeService(repo)
	datasetService := service.NewDatasetService(repo)
	modelService := service.NewModelService(repo)
	analyticsService := service.NewAnalyticsService(repo)

	h := handler.New(
		detectionService,
		treeService,
		datasetService,
		modelService,
		analyticsService,
		db,
	)

	r := httpRouter.NewRouter(cfg, h)
	cleanup := func() {
		_ = db.Close()
	}

	return r, cleanup, nil
}

func RunMigrations(cfg config.Config) error {
	db, err := database.OpenPostgres(cfg)
	if err != nil {
		return err
	}
	defer db.Close()

	return bootstrapDatabase(context.Background(), db)
}

func bootstrapDatabase(ctx context.Context, db *sql.DB) error {
	if err := migration.Run(ctx, db); err != nil {
		return err
	}

	if err := migration.Seed(ctx, db); err != nil {
		return err
	}

	return nil
}
