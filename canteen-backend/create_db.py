# create_db.py
from app import app, db

print("Connecting to the database and creating tables...")

# The app_context is needed for SQLAlchemy to know which app to work with
with app.app_context():
    db.create_all()

print("Tables created successfully.")