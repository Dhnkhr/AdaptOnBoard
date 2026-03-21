# ---- Stage 1: Build Next.js frontend ----
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build

# ---- Stage 2: Python backend + serve frontend ----
FROM python:3.11-slim
WORKDIR /app

# Install Node.js first (for Next.js server)
RUN apt-get update && apt-get install -y curl bash && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY backend/ ./backend/

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package*.json ./frontend/
COPY --from=frontend-builder /app/frontend/next.config.ts ./frontend/

# Install production dependencies for Next.js
WORKDIR /app/frontend
RUN npm ci --only=production

# Copy startup script
WORKDIR /app
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 3000 8000

CMD ["./start.sh"]
