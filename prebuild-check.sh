#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=== Running Expo Doctor verification ==="
npx expo-doctor

echo "=== Prebuild check completed successfully! ==="
