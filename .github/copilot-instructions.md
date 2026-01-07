# Capstone Hub - AI Coding Instructions

You are working on **Capstone Hub**, a project management system for student capstone projects. The system consists of a Go backend, a Next.js frontend, and a Socket.IO server.

## 🏗 Project Architecture

### 1. Backend (`/backend`)
- **Framework**: Go 1.24 with Gin Web Framework.
- **Database**: PostgreSQL with GORM.
- **Structure**:
  - `controller/`: Request handlers grouped by feature (e.g., `advisor`, `auth`, `chat`).
  - `entity/`: GORM models with `govalidator` tags.
  - `service/`: Business logic (e.g., `jwtService`, `emailService`).
  - `middleware/`: Auth (`AuthMiddleware`) and Role checks (`RoleGuard`).
  - `mockData/`: Data seeding logic.
- **Entry Point**: `main.go` initializes DB, middleware, and routes.

### 2. Frontend (`/frontend`)
- **Framework**: Next.js 16 (App Router).
- **Language**: TypeScript.
- **UI Stack**: Ant Design (`antd`), Material Tailwind, Tailwind CSS v4.
- **State/API**: Axios for HTTP requests.
- **Structure**:
  - `app/(modules)/`: Feature-based route groups.
  - `app/components/`: Reusable UI components.
  - `app/services/`: API integration functions.
  - `socket-server/`: Separate Node.js Express + Socket.IO server for real-time features.

### 3. Infrastructure
- **Docker**: `docker-compose.yml` orchestrates Postgres, Backend, Socket Server.
- **Ports**:
  - Frontend: `5173`
  - Backend: `8080` (internal), exposed via Docker.
  - Socket: `3001`
  - Postgres: `5432` (mapped to `5433` host).

## 🛠 Development Workflows

### Backend
- **Run**: `go run main.go`
- **Seed Data**: `go run main.go --seed` (Critical for setting up initial roles/users).
- **Testing**: Uses `testing` package with `gomega`.
  - Run tests: `go test ./test/...`
  - Validation tests are in `backend/test/` (e.g., `acStatus_validation_test.go`).

### Frontend
- **Run**: `npm run dev` (starts on port 5173).
- **Lint**: `npm run lint`.

## 📝 Coding Conventions

### Go (Backend)
- **Validation**: Use `govalidator` tags in `entity` structs.
  - Example: `valid:"required~Status is required"`
- **Database**: Use `gorm.Model` for base fields (ID, CreatedAt, etc.).
- **Routing**: Group routes by feature in `main.go` under `protected` group for authenticated endpoints.
- **Error Handling**: Return JSON with `error` field.

### TypeScript (Frontend)
- **Components**: Use Functional Components with Hooks.
- **Styling**: Prefer Tailwind utility classes. Use Ant Design components for complex UI (Tables, Forms).
- **API**: Centralize API calls in `app/services/`. Do not make raw Axios calls in components.
- **Routing**: Use Next.js App Router conventions (`page.tsx`, `layout.tsx`).

## 🔍 Key Files
- `backend/main.go`: Route definitions and server setup.
- `backend/entity/`: Database schema definitions.
- `frontend/app/services/`: API client functions.
- `docker-compose.yml`: Service orchestration.
