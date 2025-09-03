# Full-Stack Canteen Management System

A complete, full-stack web application for managing a canteen. This system provides a seamless experience for customers to browse the menu and place orders, and a powerful dashboard for administrators to manage the entire workflow, from menu updates to order fulfillment and user management.

This project was built from the ground up, featuring a decoupled frontend and a secure, role-based REST API backend.

**Live Demo:** `https://my-canteen-123.netlify.app/index.html`

-----

## Screenshot

**Home Page**
<img width="1895" height="908" alt="image" src="https://github.com/user-attachments/assets/6b8e8648-c061-4515-a55d-afa5e4fb8437" />

**Admin Page**
<img width="1899" height="907" alt="image" src="https://github.com/user-attachments/assets/8b0c5b4d-3918-4fba-9271-18a6f0e060df" />

**Menu Management**
<img width="1896" height="904" alt="image" src="https://github.com/user-attachments/assets/b722317a-4132-4442-bacb-706b6c5ea559" />

**User Management**
<img width="1895" height="912" alt="image" src="https://github.com/user-attachments/assets/6cec2504-184c-4a06-bbc5-4309db4f9f89" />

**Sales Report Page**
<img width="1897" height="908" alt="image" src="https://github.com/user-attachments/assets/8b2ba882-5c8a-4df3-8419-8a72746a37da" />

-----

## Features

### 👤 Customer Features

  * **User Authentication:** Secure user registration and login with JWT (JSON Web Token) based authentication.
  * **Public Menu:** Guests can view the menu before logging in.
  * **Shopping Cart:** A fully interactive client-side cart to add/remove items and adjust quantities.
  * **Place Orders:** Authenticated users can place orders from their cart.
  * **Order History:** Users can view a complete history of their past orders, grouped by date.
  * **Daily Order Number:** Both the global order ID and a user-friendly, daily-resetting order number are displayed.

### 👑 Admin Features

  * **Role-Based Access Control:** A secure admin decorator protects all administrative endpoints.
  * **Order Dashboard:** View a live list of all orders from all users, grouped by date.
  * **Update Order Status:** Change the status of any order through a simple dropdown (`Awaiting Approval`, `Confirmed`, `Completed`, `Cancelled`).
  * **Menu Management (CRUD):** A full interface to Add, View, Edit, and Delete menu items.
  * **User Management:** View all registered users and promote/demote users between 'customer' and 'admin' roles.
  * **Sales Reporting:** Generate simple sales reports for a given date range, showing total revenue and an itemized breakdown of items sold.
  * **Safety Lock:** The system prevents the last remaining admin from accidentally demoting themselves.

-----

## Technology Stack

### Backend

  * **Framework:** Flask
  * **Database:** PostgreSQL (for production), SQLite (for development)
  * **ORM:** Flask-SQLAlchemy
  * **Authentication:** Flask-JWT-Extended (JWTs), Flask-Bcrypt (Password Hashing)
  * **API Server:** Gunicorn
  * **CORS:** Flask-Cors

### Frontend

  * **Core:** HTML5, CSS3, Vanilla JavaScript (ES6+)
  * **API Communication:** `fetch` API

### Deployment

  * **Backend & DB:** Render (PaaS)
  * **Frontend:** Netlify
  * **Version Control:** Git & GitHub

-----

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

  * Python 3.10+ and `pip`
  * Node.js and `npm` (for potential future frontend tools)
  * Git

### Backend Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/Harsh-G-N/canteen.git
    cd canteen/canteen-backend
    ```
2.  **Create and activate a virtual environment:**
    ```sh
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  **Install Python dependencies:**
    ```sh
    pip install -r requirements.txt
    ```
4.  **Initialize the database and add a admin user:**
    ```sh
    # First, set environment variables for the admin user
    # export ADMIN_EMAIL="admin@example.com"
    # export ADMIN_PASSWORD="your-secure-password"
    # Then run the seed script
    python create_db.py 
    ```
5.  **Run the Flask server:**
    ```sh
    flask run
    ```
    Your backend API will be running at `http://127.0.0.1:5000`.

### Frontend Setup

1.  **Navigate to the frontend folder:**
    ```sh
    cd ../canteen-frontend 
    ```
2.  **Update the API URL:** In each JavaScript file (`index.js`, `app.js`, `admin.js`, etc.), make sure the `API_BASE_URL` or fetch URL is pointing to your local backend:
    ```js
    const API_BASE_URL = 'http://127.0.0.1:5000';
    ```
3.  **Run the frontend:** There is no build step. Simply open the `index.html` file in your web browser.

-----

## API Endpoints

A summary of the available API endpoints.

| Method | Endpoint                       | Access    | Description                                  |
| :----- | :----------------------------- | :-------- | :------------------------------------------- |
| `POST` | `/api/register`                | Public    | Register a new user.                         |
| `POST` | `/api/login`                   | Public    | Log in to get a JWT.                         |
| `GET`  | `/api/profile`                 | Customer  | Get the profile of the logged-in user.       |
| `GET`  | `/api/menu`                    | Public    | Get a list of all menu items.                |
| `POST` | `/api/menu`                    | Admin     | Add a new menu item.                         |
| `PUT`  | `/api/menu/<id>`               | Admin     | Update an existing menu item.                |
| `DELETE`| `/api/menu/<id>`              | Admin     | Delete a menu item.                          |
| `POST` | `/api/orders`                  | Customer  | Place a new order.                           |
| `GET`  | `/api/orders`                  | Customer  | Get the order history for the logged-in user.|
| `GET`  | `/api/admin/orders`            | Admin     | Get a list of all orders from all users.     |
| `PUT`  | `/api/admin/orders/<id>`       | Admin     | Update the status of an order.               |
| `GET`  | `/api/admin/users`             | Admin     | Get a list of all users.                     |
| `PUT`  | `/api/admin/users/<id>`        | Admin     | Update a user's role.                        |
| `GET`  | `/api/admin/reports/sales`     | Admin     | Get a sales report for a date range.         |
