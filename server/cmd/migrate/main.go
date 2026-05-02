package main

import (
	"log"

	app "mopad/server/internal"
	"mopad/server/pkg/config"
)

func main() {
	cfg := config.Load()
	if err := app.RunMigrations(cfg); err != nil {
		log.Fatalf("migration failed: %v", err)
	}

	log.Println("migration completed")
}
