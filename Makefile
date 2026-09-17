.PHONY: help run dev up down db-up db-down db-logs install build start lint typecheck reset clean

APP_DIR := app

help: ## Show this help
	@grep -E '^[a-zA-Z0-9_-]+:.*## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*## "}; {printf "  %-12s %s\n", $$1, $$2}'

run: db-up install dev ## Start Postgres then the dev server (full local run)

dev: ## Start the Next.js dev server (expects Postgres already running)
	cd $(APP_DIR) && npm run dev

db-up: ## Start Postgres via docker compose
	docker compose up -d

db-down: ## Stop Postgres (keeps data volume)
	docker compose down

db-logs: ## Tail Postgres logs
	docker compose logs -f postgres

install: ## Install app dependencies (safe to re-run, skips if node_modules exists)
	cd $(APP_DIR) && [ -d node_modules ] || npm install

build: ## Production build of the app
	cd $(APP_DIR) && npm run build

start: ## Run the production build (run `make build` first)
	cd $(APP_DIR) && npm run start

lint: ## Run eslint
	cd $(APP_DIR) && npm run lint

typecheck: ## Type-check the app with tsc
	cd $(APP_DIR) && npx tsc --noEmit

reset: ## Reset seed data via the running app's API (app must be up)
	curl -s -X POST http://localhost:3000/api/reset && echo

clean: db-down ## Stop Postgres and remove its data volume (destructive)
	docker compose down -v
