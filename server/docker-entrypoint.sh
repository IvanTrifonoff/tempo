#!/bin/sh
set -e

echo "Running database migrations..."
npm run migrate

echo "Syncing changelog..."
node scripts/syncChangelog.js

echo "Starting server..."
exec node server.js
