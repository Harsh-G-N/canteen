import os
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager, get_jwt
from datetime import date, datetime, timezone, timedelta
from functools import wraps
from flask_cors import CORS
from sqlalchemy import func


# --- Custom Decorator for Admin-Only Routes ---
def admin_required():
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            claims = get_jwt()
            if claims.get("role") == 'admin':
                return fn(*args, **kwargs)
            else:
                return jsonify(msg="Admins only!"), 403 # 403 Forbidden
        return decorator
    return wrapper

# Get the absolute path of the directory where this file is located
basedir = os.path.abspath(os.path.dirname(__file__))

# --- App and Database Configuration ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "https://my-canteen-123.netlify.app"}})

# This logic checks if a production DATABASE_URL is set, otherwise falls back to SQLite
database_url = os.getenv("DATABASE_URL")
if database_url:
    # The Render database URL starts with postgres://, but SQLAlchemy needs postgresql://
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url.replace("postgres://", "postgresql://", 1)
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'database.db')

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config["JWT_SECRET_KEY"] = "79817e82e000a37e7e63449afc628c52" 
jwt = JWTManager(app)


# Create the SQLAlchemy database instance
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

# --- Database Model Definition ---
# MenuItem Model
class MenuItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    is_available = db.Column(db.Boolean, default=True)

    def to_dict(self):
        """Converts the MenuItem object to a dictionary for JSON serialization."""
        return {
            'id': self.id,
            'name': self.name,
            'price': self.price,
            'is_available': self.is_available
        }
    
# NEW User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='customer') # e.g., 'customer', 'admin'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role
        }

# Order and OrderItem Models
class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_item.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    menu_item = db.relationship('MenuItem')

    def to_dict(self):
        return {
            'menu_item_name': self.menu_item.name,
            'quantity': self.quantity,
            'price_per_item': self.menu_item.price
        }

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    daily_order_id = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    order_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    status = db.Column(db.String(20), nullable=False, default='Awaiting Approval')
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade="all, delete-orphan") # Added cascade

    def to_dict(self):
        return {
            'order_id': self.id,
            'daily_order_id': self.daily_order_id,
            'total_amount': self.total_amount,
            # Format the date to a more readable string
            'order_date': self.order_date.isoformat(), 
            'status': self.status,
            'items': [item.to_dict() for item in self.items]
        }


# ----------------------- Menu Routes -------------------------
# --- API Route to get menu items ---
@app.route('/api/menu', methods=['GET'])
def get_menu():
    """
    This function now queries the database to get all menu items,
    converts them to dictionaries, and returns them as JSON.
    """
    # Query the database for all menu items
    items_from_db = MenuItem.query.all()
    
    # Convert the list of MenuItem objects to a list of dictionaries
    menu_list = [item.to_dict() for item in items_from_db]
    
    return jsonify(menu_list)

# --- API Route to ADD a new item ---
@app.route('/api/menu', methods=['POST'])
@admin_required()
def add_menu_item():
    """
    This function receives data from a POST request to add a new menu item.
    """
    # Get the JSON data from the request body
    data = request.get_json()

    # Basic validation
    if not data or not 'name' in data or not 'price' in data:
        return jsonify({'message': 'Error: Missing name or price'}), 400

    # Create a new MenuItem instance
    new_item = MenuItem(
        name=data['name'],
        price=data['price'],
        is_available=data.get('is_available', True) # Default to True if not provided
    )

    # Add to the database
    db.session.add(new_item)
    db.session.commit()

    # Return the newly created item's data with a 201 Created status code
    return jsonify(new_item.to_dict()), 201

# --- API Route to UPDATE a specific item ---
@app.route('/api/menu/<int:item_id>', methods=['PUT'])
@admin_required()
def update_menu_item(item_id):
    """
    This function finds a menu item by its ID and updates it
    with the data from the request body.
    """
    # Find the item by its ID; get_or_404 returns a 404 error if not found
    item = MenuItem.query.get_or_404(item_id)
    
    data = request.get_json()

    # Update the item's attributes
    item.name = data.get('name', item.name)
    item.price = data.get('price', item.price)
    item.is_available = data.get('is_available', item.is_available)
    
    # Commit the changes to the database
    db.session.commit()
    
    return jsonify(item.to_dict())

# --- API Route to DELETE a specific item ---
@app.route('/api/menu/<int:item_id>', methods=['DELETE'])
@admin_required()
def delete_menu_item(item_id):
    """
    This function finds a menu item by its ID and deletes it.
    """
    item = MenuItem.query.get_or_404(item_id)
    
    # Delete the item
    item.is_available = False # Soft delete by marking as unavailable
    db.session.commit()
    
    # Return a success message
    return jsonify({'message': f'Item with id {item_id} has been marked as unavailable.'})

# ---------------------User Registration Route ----------------------------------
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()

    # Basic validation
    if not data or not 'name' in data or not 'email' in data or not 'password' in data:
        return jsonify({'message': 'Missing required fields'}), 400

    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already registered'}), 409 # 409 Conflict

    # Hash the password
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    new_user = User(
        name=data['name'],
        email=data['email'],
        password_hash=hashed_password
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully'}), 201

# ------------Login and Protected Routes -----------------------------
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not 'email' in data or not 'password' in data:
        return jsonify({'message': 'Missing email or password'}), 400

    user = User.query.filter_by(email=data['email']).first()
    
    if user and bcrypt.check_password_hash(user.password_hash, data['password']):
        access_token = create_access_token(
            identity=str(user.id), additional_claims={'role': user.role}
        )
        return jsonify(access_token=access_token)

    return jsonify({'message': 'Invalid credentials'}), 401


# A protected route that requires a valid JWT
@app.route('/api/profile')
@jwt_required() # This decorator protects the route
def profile():
    # Access the identity of the current user with get_jwt_identity
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user:
        return jsonify(logged_in_as=user.name, email=user.email, role=user.role)
    
    return jsonify({'message': 'User not found'}), 404

# ---------------------- API Route to Place an Order ------------------------
@app.route('/api/orders', methods=['POST'])
@jwt_required()
def place_order():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    if not data or 'items' not in data or not isinstance(data['items'], list) or not data['items']:
        return jsonify({'message': 'Invalid or empty order data provided'}), 400

    try:
        # --- NEW LOGIC TO CALCULATE DAILY ORDER ID ---
        today_start = datetime.combine(date.today(), datetime.min.time(), tzinfo=timezone.utc)
        orders_today_count = db.session.query(Order).filter(Order.order_date >= today_start).count()
        new_daily_id = orders_today_count + 1
        # --- END OF NEW LOGIC ---

        total_amount = 0
        order_items_data = []

        # (The rest of your item validation and total calculation logic is the same)
        for item_data in data['items']:
            menu_item = MenuItem.query.get(item_data.get('menu_item_id'))
            quantity = item_data.get('quantity')
            if not menu_item or not quantity or quantity <= 0 or not menu_item.is_available:
                return jsonify({'message': f"Item with id {item_data.get('menu_item_id')} is invalid or unavailable"}), 400
            total_amount += menu_item.price * quantity
            order_items_data.append({'menu_item': menu_item, 'quantity': quantity})

        # MODIFIED: Add the daily_order_id when creating the order
        new_order = Order(user_id=current_user_id, total_amount=total_amount, daily_order_id=new_daily_id)
        db.session.add(new_order)
        db.session.flush()

        for item in order_items_data:
            order_item = OrderItem(order_id=new_order.id, menu_item_id=item['menu_item'].id, quantity=item['quantity'])
            db.session.add(order_item)

        db.session.commit()
        return jsonify({'message': 'Order placed successfully', 'order': new_order.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to place order', 'error': str(e)}), 500

# --- API Route to GET a user's own orders ---
@app.route('/api/orders', methods=['GET'])
@jwt_required()
def get_my_orders():
    current_user_id = int(get_jwt_identity())
    
    # Query for all orders placed by the current user, newest first
    orders = Order.query.filter_by(user_id=current_user_id).order_by(Order.order_date.desc()).all()
    
    # Convert the list of order objects to a list of dictionaries
    orders_list = [order.to_dict() for order in orders]
    
    return jsonify(orders_list)

# --- API Route for Admins to GET ALL orders ---
@app.route('/api/admin/orders', methods=['GET'])
@admin_required()
def get_all_orders():
    # Query all orders, newest first
    orders = Order.query.order_by(Order.order_date.desc()).all()
    orders_list = [order.to_dict() for order in orders]
    return jsonify(orders_list)

# --- API Route for Admins to UPDATE an order's status ---
@app.route('/api/admin/orders/<int:order_id>', methods=['PUT'])
@admin_required()
def update_order_status(order_id):
    # Find the order by its ID, return 404 if not found
    order = Order.query.get_or_404(order_id)
    
    data = request.get_json()

    # Basic validation
    new_status = data.get('status')
    if not new_status:
        return jsonify({'message': 'Missing status field'}), 400

    # Optional: More robust validation
    valid_statuses = ['Awaiting Approval', 'Confirmed', 'Completed', 'Cancelled']
    if new_status not in valid_statuses:
        return jsonify({'message': f'Invalid status. Must be one of: {valid_statuses}'}), 400

    # Update the status
    order.status = new_status
    db.session.commit()
    
    return jsonify(order.to_dict())


#api to get the list of all users (for admin only)
@app.route('/api/admin/users', methods=['GET'])
@admin_required()
def get_all_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])


#api to update the role of specific user (for admin only)
@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@admin_required()
def update_user_role(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    new_role = data.get('role')
    if new_role not in ['customer', 'admin']:
        return jsonify({'message': 'Invalid role specified'}), 400
    
     # Check if we are trying to demote the last admin
    if user.role == 'admin' and new_role == 'customer':
        admin_count = User.query.filter_by(role='admin').count()
        if admin_count <= 1:
            # 403 Forbidden is a good status code for this
            return jsonify({'message': 'Cannot demote the last admin.'}), 403
        
    user.role = new_role
    db.session.commit()
    
    return jsonify(user.to_dict())

# API endpoint to get Sales Report

@app.route('/api/admin/reports/sales', methods=['GET'])
@admin_required()
def get_sales_report():
    # Get date range from query parameters, default to today
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    try:
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            start_date = date.today()

        if end_date_str:
            # Add one day to the end_date to include the entire day in the query
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date() + timedelta(days=1)
        else:
            end_date = date.today() + timedelta(days=1)
    except ValueError:
        return jsonify({"message": "Invalid date format. Please use YYYY-MM-DD."}), 400

    # --- Query for summary data ---
    # We only care about orders that are 'Completed'
    completed_orders_query = Order.query.filter(
        Order.status == 'Completed',
        Order.order_date >= start_date,
        Order.order_date < end_date
    )
    
    total_revenue = completed_orders_query.with_entities(func.sum(Order.total_amount)).scalar() or 0
    total_orders = completed_orders_query.count()

    # --- Query for itemized breakdown ---
    item_breakdown_query = db.session.query(
        MenuItem.name,
        func.sum(OrderItem.quantity).label('total_quantity')
    ).join(OrderItem, OrderItem.menu_item_id == MenuItem.id)\
     .join(Order, Order.id == OrderItem.order_id)\
     .filter(
        Order.status == 'Completed',
        Order.order_date >= start_date,
        Order.order_date < end_date
    ).group_by(MenuItem.name).order_by(func.sum(OrderItem.quantity).desc())

    item_breakdown = [{"name": name, "quantity": qty} for name, qty in item_breakdown_query.all()]

    return jsonify({
        "summary": {
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "start_date": start_date.strftime('%Y-%m-%d'),
            "end_date": (end_date - timedelta(days=1)).strftime('%Y-%m-%d')
        },
        "item_breakdown": item_breakdown
    })


# --- Main execution point ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)