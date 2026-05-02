package main

import (
	"log"

	app "mopad/server/internal"
	"mopad/server/pkg/config"
)

func main() {
	cfg := config.Load()
	r, cleanup, err := app.BuildHTTPRouter(cfg)
	if err != nil {
		log.Fatalf("failed to bootstrap API server: %v", err)
	}
	defer cleanup()

	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("failed to run API server: %v", err)
	}
}
