FROM python:3.11-slim

WORKDIR /app

# Install backend dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code into the 'backend' python module directory
COPY . /app/backend

# Add /app to the python path so the backend folder is importable
ENV PYTHONPATH=/app

# --- BAKE THE KEYS IN ---
ENV GROQ_API_KEY="REMOVED_SECRET"
ENV GROQ_MODEL="llama-3.3-70b-versatile"
ENV PORT="8000"

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
