#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Create the database tables
python -c "from app import app, db; with app.app_context(): db.create_all()"