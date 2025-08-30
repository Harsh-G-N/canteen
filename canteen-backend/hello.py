from app import app, db, User, bcrypt

# --- List of users to add ---
users_to_add = [
    {
        "name": "Harsh",
        "email": "harsh@gmail.com",
        "password": "harsh123",
        "role": "admin"
    },
    {
        "name": "Priya Menon",
        "email": "priya.menon@example.com",
        "password": "customerpassword1",
        "role": "customer"
    },
    {
        "name": "Sanjay Kumar",
        "email": "sanjay.kumar@example.com",
        "password": "customerpassword2",
        "role": "customer"
    }
]

def create_users():
    # All database operations must be within the app context
    with app.app_context():
        print("Starting to add users...")
        
        for user_data in users_to_add:
            # Check if a user with this email already exists
            existing_user = User.query.filter_by(email=user_data['email']).first()
            
            if existing_user:
                print(f"User with email {user_data['email']} already exists. Skipping.")
                continue

            # If the user doesn't exist, create and add them
            try:
                # Hash the password
                hashed_password = bcrypt.generate_password_hash(user_data['password']).decode('utf-8')
                
                # Create a new User object
                new_user = User(
                    name=user_data['name'],
                    email=user_data['email'],
                    password_hash=hashed_password,
                    role=user_data['role']
                )
                
                # Add the new user to the session
                db.session.add(new_user)
                print(f"Adding user: {user_data['name']} ({user_data['email']})")

            except Exception as e:
                print(f"Error adding user {user_data['email']}: {e}")
                db.session.rollback() # Rollback in case of an error with one user
                
        # Commit all the changes to the database
        try:
            db.session.commit()
            print("All new users have been added successfully.")
        except Exception as e:
            print(f"Error committing to database: {e}")
            db.session.rollback()

# This makes the script runnable from the command line
if __name__ == '__main__':
    
    with app.app_context():
        db.create_all()

    create_users()