#!/bin/bash

# Navigate to the script directory
cd "$(dirname "$0")"

echo "🎓 Building EduCard Frontend with Docker..."
echo "Working directory: $(pwd)"
echo ""

# Build and run
docker compose up --build -d educard-frontend-dev

if [[ $? -eq 0 ]]; then
    echo ""
    echo "✅ Success! Development server is starting..."
    echo "📝 View logs with: docker compose logs -f educard-frontend-dev"
    echo "🌐 Access the app at: http://localhost:5173"
    echo ""
    echo "To view logs, run:"
    echo "  docker compose logs -f educard-frontend-dev"
else
    echo ""
    echo "❌ Build failed. Check the output above for errors."
    exit 1
fi
