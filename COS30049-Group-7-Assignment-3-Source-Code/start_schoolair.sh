#!/usr/bin/env bash
# ============================================================================
# SchoolAir Full-Stack Application Launcher (FastAPI Backend + React Frontend)
# ============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

echo "=================================================================="
echo " Starting SchoolAir FastAPI Backend on http://localhost:8000 ..."
echo "=================================================================="
cd "$SCRIPT_DIR/backend"
"$SCRIPT_DIR/backend/.venv/bin/python" -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

trap "echo 'Stopping SchoolAir servers...'; kill $BACKEND_PID 2>/dev/null || true" EXIT

sleep 2
echo "=================================================================="
echo " Starting SchoolAir React.js Frontend on http://localhost:3000 ..."
echo "=================================================================="
cd "$SCRIPT_DIR/frontend"
npm start
