# ---- Stage 1: Build Next.js frontend ----
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV NEXT_PUBLIC_API_URL=http://localhost:8000
RUN npm run build

# ---- Stage 2: Python backend + serve frontend ----
FROM python:3.11-slim
WORKDIR /app

# Install backend deps
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY backend/ ./backend/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package*.json ./frontend/
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules

# Install Node for Next.js server
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Start script
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 3000 8000

CMD ["./start.sh"]
