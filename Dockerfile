# ==========================================
# Multi-Stage Dockerfile for Paisa Saathi
# Stage 1: Build React Frontend
# Stage 2: Python FastAPI Backend + Static Frontend
# ==========================================

# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# --- Stage 2: Production Backend Server ---
FROM python:3.11-slim AS production

# Prevent Python from writing .pyc and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Install system dependencies (build-essential, libgomp1 for LightGBM)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application backend code
COPY backend ./backend

# Copy pre-trained models and dataset files
COPY data/models ./data/models
COPY data/synthetic/customers.csv ./data/synthetic/customers.csv
COPY data/synthetic/nodes.csv ./data/synthetic/nodes.csv
COPY data/synthetic/graph_edges.csv ./data/synthetic/graph_edges.csv
COPY data/synthetic/emis.csv ./data/synthetic/emis.csv

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose server port
EXPOSE 8000

# Run FastAPI via Uvicorn
CMD ["sh", "-c", "uvicorn backend.app:app --host 0.0.0.0 --port ${PORT:-8000}"]

