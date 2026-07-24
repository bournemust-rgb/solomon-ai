#!/bin/bash
# Render build script - installs Chromium for Puppeteer

echo "🚀 Installing Chromium for Puppeteer..."
apt-get update
apt-get install -y chromium

echo "✅ Chromium installed at: $(which chromium)"
echo "📦 Installing Node dependencies..."
npm install

echo "✅ Build complete!"
