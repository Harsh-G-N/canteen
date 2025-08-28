from app import app, db, MenuItem, Order, OrderItem

# --- Data for the new menu items ---
new_menu_items = [
    {
        "name": "Puttu and Kadala Curry",
        "price": 80.00,
        "is_available": True
    },
    {
        "name": "Appam and Stew",
        "price": 90.00,
        "is_available": True
    },
    {
        "name": "Masala Dosa",
        "price": 65.00,
        "is_available": True
    },
    {
        "name": "Pazham Pori (Banana Fritters)",
        "price": 12.00,
        "is_available": True
    },
    {
        "name": "Uzhunnu Vada",
        "price": 10.00,
        "is_available": True
    },
    {
        "name": "Kerala Beef Fry",
        "price": 160.00,
        "is_available": False # Example of an unavailable item
    },
    {
        "name": "Sulaimani Chai (Spiced Tea)",
        "price": 15.00,
        "is_available": True
    }
]


# The main seeding function
def seed_data():
    # All database operations must be within the app context
    with app.app_context():
        
        print("Clearing old data...")
        # The order of deletion is important to avoid foreign key constraint errors.
        # Delete items that depend on others first.
        OrderItem.query.delete()
        Order.query.delete()
        MenuItem.query.delete()
        print("Old menu and order data cleared.")

        print("Adding new menu items...")
        # Add new menu items from the list above
        for item_data in new_menu_items:
            item = MenuItem(
                name=item_data['name'],
                price=item_data['price'],
                is_available=item_data['is_available']
            )
            db.session.add(item)
        
        # Commit all the changes to the database
        db.session.commit()
        print("Seeding complete!")

# This makes the script runnable from the command line
if __name__ == '__main__':
    seed_data()