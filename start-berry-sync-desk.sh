#!/bin/sh
cd "$(dirname "$0")/../berry-sync-desk"
exec npm run dev -- --port 3001
