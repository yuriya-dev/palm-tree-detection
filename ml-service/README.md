# ML Service

FastAPI service for palm tree detection inference.

## Run Locally

```bash
cd ml-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

## Model Weights

Set `MODEL_PATH` to the trained YOLO weight file if you want real inference.
If the model is missing, the service falls back to a deterministic heuristic so the API still works.
