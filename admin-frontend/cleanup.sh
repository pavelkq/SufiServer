#!/bin/bash
# Удаляем ненужные файлы для экономии места
find . -name "*.log" -type f -delete
find . -name "*.tmp" -type f -delete
find . -name "*.temp" -type f -delete
find . -name "*.cache" -type f -delete
find node_modules -name "*.map" -type f -delete 2>/dev/null || true
find node_modules -name "*.md" -type f -delete 2>/dev/null || true
find node_modules -name "*.txt" -type f -delete 2>/dev/null || true
find node_modules -name "test" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules -name "docs" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules -name "examples" -type d -exec rm -rf {} + 2>/dev/null || true