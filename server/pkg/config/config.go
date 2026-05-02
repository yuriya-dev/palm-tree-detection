package config

import (
	"os"
	"strings"
)

type Config struct {
	Port           string
	AllowedOrigins []string
	DBHost         string
	DBPort         string
	DBUser         string
	DBPassword     string
	DBName         string
	DBSSLMode      string
	MLServiceURL   string
}

func Load() Config {
	return Config{
		Port:           getEnv("PORT", "8080"),
		AllowedOrigins: splitCSV(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173")),
		DBHost:         getEnv("DB_HOST", "localhost"),
		DBPort:         getEnv("DB_PORT", "5432"),
		DBUser:         getEnv("DB_USER", "postgres"),
		DBPassword:     getEnv("DB_PASSWORD", "postgres"),
		DBName:         getEnv("DB_NAME", "postgres"),
		DBSSLMode:      getEnv("DB_SSLMODE", "disable"),
		MLServiceURL:   getEnv("ML_SERVICE_URL", "http://localhost:8000"),
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok && strings.TrimSpace(value) != "" {
		return value
	}

	return fallback
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	cleaned := make([]string, 0, len(parts))
	for _, item := range parts {
		trimmed := strings.TrimSpace(item)
		if trimmed != "" {
			cleaned = append(cleaned, trimmed)
		}
	}

	if len(cleaned) == 0 {
		return []string{"http://localhost:5173"}
	}

	return cleaned
}
