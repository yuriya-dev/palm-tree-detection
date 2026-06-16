# Palm Tree Detection Fullstack Project

Platform fullstack untuk deteksi dan monitoring kondisi pohon sawit berbasis citra UAV.
Project ini menggabungkan:

- Frontend dashboard interaktif (React + Vite)
- Backend REST API (Golang + Gin)
- Pipeline machine learning untuk training/inference deteksi pohon

## Arsitektur

### 1. Frontend (client)
- React 19 + Vite
- Tailwind CSS
- Zustand untuk state management
- Recharts untuk visualisasi
- Leaflet untuk peta monitoring

Fitur halaman utama:
- Dashboard overview statistik deteksi
- Detection (upload citra + konfigurasi threshold/model)
- Monitoring (map + tabel pohon dengan filter)
- Datasets management
- Models management
- Analytics
- Settings

### 2. Backend (server)
- Golang 1.22
- Gin Web Framework + CORS middleware
- PostgreSQL untuk penyimpanan data
- REST API dengan response format terstandarisasi
- Auto migration tabel saat server startup

Endpoint yang tersedia:
- POST /api/v1/detect
- GET /api/v1/detections
- GET /api/v1/detections/:id
- DELETE /api/v1/detections/:id
- GET /api/v1/trees
- GET /api/v1/trees/:id
- GET /api/v1/trees/stats
- GET /api/v1/datasets
- POST /api/v1/datasets
- DELETE /api/v1/datasets/:id
- GET /api/v1/models
- POST /api/v1/models/:id/activate
- GET /api/v1/models/:id/metrics
- GET /api/v1/analytics/overview
- GET /api/v1/analytics/trend
- GET /api/v1/health

### 3. Machine Learning (ml-service)
- Service inferensi FastAPI yang membaca weight hasil training dari notebook
- Weight model dapat ditaruh di:
  - ml-service/models/best.pt
- Jika weight tidak tersedia, service tetap berjalan dengan fallback heuristik

## Catatan Integrasi Saat Ini

- Frontend detection sudah terhubung ke endpoint backend POST /api/v1/detect.
- Backend detection terhubung ke Python ML service (FastAPI) via ML_SERVICE_URL.
- Jika Python ML service tidak aktif, backend akan fallback ke prediksi heuristik agar API tetap berjalan.

## Struktur Direktori

```text
palm-tree-detection/
|- client/    # Frontend React
|- server/    # Backend Go (Gin)
|- ml-service/ # Service inferensi ML (FastAPI + YOLO)
|- notebook/   # Notebook training dan dataset
```

## Cara Menjalankan Project

### Prasyarat
- Node.js 18+
- npm
- Go 1.22+
- PostgreSQL 14+
- Python 3.8+ (untuk modul ML)

### 1) Setup PostgreSQL

Gunakan kredensial default:

- user: postgres
- password: postgres

Konfigurasi koneksi backend (opsional, karena sudah punya default yang sama):

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=postgres
export DB_SSLMODE=disable
export ML_SERVICE_URL=http://localhost:8000
```

### 2) Jalankan Python ML Service

```bash
cd ml-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

Service default berjalan di:
- http://localhost:8000

Jika Anda punya weight hasil training dari notebook, simpan ke `ml-service/models/best.pt` lalu set `MODEL_PATH` ke file tersebut.

### 3) Jalankan Backend

```bash
cd server
go mod tidy
go run ./cmd/migrate
go run ./cmd/api
```

Server default berjalan di:
- http://localhost:8080

### 4) Jalankan Frontend

```bash
cd client
npm install
npm run dev
```

Frontend default berjalan di:
- http://localhost:5173

Opsional environment variable frontend:

```bash
VITE_API_URL=http://localhost:8080
```

Jika tidak diset, frontend otomatis memakai http://localhost:8080.

### 5) Jalankan Training ML (opsional)

```bash
cd notebook
# buka dan jalankan palmtree_detection.ipynb untuk training / export model
```

### 6) Jalankan Inference ML (opsional)

```bash
cd ml-service
set MODEL_PATH=D:\path\to\best.pt
uvicorn app:app --host 0.0.0.0 --port 8000
```

## Referensi ML

Untuk dataset, project ini mengambil referensi dari:

- https://github.com/rs-dl/MOPAD

Jika Anda menggunakan pipeline ML ini untuk kebutuhan riset/publikasi, mohon sertakan sitasi ke paper MOPAD yang relevan.

