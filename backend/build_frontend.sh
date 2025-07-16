#!/bin/bash
set -e

echo "Building frontend..."
cd ../frontend
npm run build

echo "Copying frontend dist to backend..."
rm -rf ../backend/frontend_dist/*
cp -r dist/* ../backend/frontend_dist/

echo "Frontend build complete and copied to backend/frontend_dist/"