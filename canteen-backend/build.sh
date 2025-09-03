#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# CHANGED: Execute the new script instead of the one-liner
python create_db.py