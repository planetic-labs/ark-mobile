#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=== Running TypeScript verification (tsc --noEmit) ==="
npx tsc --noEmit

echo "=== Running Expo Doctor verification ==="
npx expo-doctor

echo "=== Running test suite (jest) ==="
npx jest --watchAll=false --passWithNoTests

echo "=== Verification completed successfully! ==="
