#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=== Running TypeScript verification (tsc --noEmit) ==="
npx tsc --noEmit

echo "=== Running test suite (jest) ==="
npx jest --watchAll=false --passWithNoTests

echo "=== Verification completed successfully! ==="
