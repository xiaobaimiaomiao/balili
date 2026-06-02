.PHONY: import server web-dev dev build

# Import JSON data into SQLite
import:
	go run cmd/import/main.go --dir ./parsed-json --db ./data/balili.db

# Start Go API server
server:
	go run cmd/server/main.go --port 8080

# Start Next.js dev server
web-dev:
	cd web && npm run dev

# Start both servers
dev:
	@echo "Starting API server on :8080..."
	@go run cmd/server/main.go --port 8080 &
	@echo "Starting Next.js dev server on :3000..."
	@cd web && npm run dev

# Build everything
build:
	go build -o bin/server cmd/server/main.go
	go build -o bin/import cmd/import/main.go
	cd web && npm run build
