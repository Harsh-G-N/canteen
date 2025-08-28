# Import the necessary components from your app
from app import app, db, bcrypt, User

# --- Details for the new user ---
new_user_name = "Priya"
new_user_email = "priya.n@example.com"
new_user_password = "securepassword456"

# This block ensures the app context is available
with app.app_context():
    # Check if the user already exists
    if not User.query.filter_by(email=new_user_email).first():
        # Hash the password securely
        hashed_password = bcrypt.generate_password_hash(new_user_password).decode('utf-8')

        # Create the new User object
        user_to_add = User(
            name=new_user_name,
            email=new_user_email,
            password_hash=hashed_password,
            role='customer'  # Explicitly setting the role
        )

        # Add the new user to the database session
        db.session.add(user_to_add)

        # Commit the changes to the database
        db.session.commit()

        print(f"User '{new_user_name}' with email '{new_user_email}' was added successfully! ✅")
    else:
        print(f"User with email '{new_user_email}' already exists. ❌")