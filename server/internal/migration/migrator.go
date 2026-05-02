package migration

import (
	"context"
	"database/sql"
	"embed"
	"fmt"
	"io/fs"
	"sort"
)

//go:embed *.sql
var migrationFiles embed.FS

func Run(ctx context.Context, db *sql.DB) error {
	entries, err := fs.ReadDir(migrationFiles, ".")
	if err != nil {
		return err
	}

	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Name() < entries[j].Name()
	})

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		query, err := migrationFiles.ReadFile(entry.Name())
		if err != nil {
			return fmt.Errorf("read migration %s: %w", entry.Name(), err)
		}

		if _, err := db.ExecContext(ctx, string(query)); err != nil {
			return fmt.Errorf("run migration %s: %w", entry.Name(), err)
		}
	}

	return nil
}
