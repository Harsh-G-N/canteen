# In your backend's create_db.py file
import os
from app import app, db, User, bcrypt # Make sure to import User and bcrypt

print("Connecting to the database and creating tables...")

# The app_context is needed for SQLAlchemy to know which app to work with
with app.app_context():
    db.create_all()

    # --- NEW: Create a default admin user ---
    # Get admin credentials from environment variables
    admin_email = os.getenv('ADMIN_EMAIL')
    admin_password = os.getenv('ADMIN_PASSWORD')

    # Check if the environment variables are set
    if admin_email and admin_password:
        # Check if an admin user already exists
        if not User.query.filter_by(email=admin_email).first():
            print(f"Creating default admin user: {admin_email}")
            
            # Hash the password
            hashed_password = bcrypt.generate_password_hash(admin_password).decode('utf-8')
            
            # Create the new user with the 'admin' role
            admin_user = User(
                name="Admin",
                email=admin_email,
                password_hash=hashed_password,
                role='admin'
            )
            
            db.session.add(admin_user)
            db.session.commit()
            print("Admin user created successfully.")
        else:
            print(f"Admin user '{admin_email}' already exists.")
    else:
        print("Admin credentials not found in environment variables. Skipping admin creation.")
    # --- END OF NEW LOGIC ---

print("Database setup complete.")