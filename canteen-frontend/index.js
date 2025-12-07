document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://16.112.15.225:5000'; // Your live URL
    // --- Get Elements ---
    const token = localStorage.getItem('token');
    const userNav = document.getElementById('user-nav');
    const menuContainer = document.getElementById('menu-container');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPriceEl = document.getElementById('cart-total-price');
    const placeOrderBtn = document.getElementById('place-order-btn');

    // --- State Management ---
    let cart = [];
    let allMenuItems = [];

    // --- Helper Functions ---
    const parseJwt = (token) => {
        try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
    };

    // --- UI Update Functions ---
    const updateUserNavigation = () => {
        if (token) {
            const user = parseJwt(token);
            const isAdmin = user && user.role === 'admin';
            userNav.innerHTML = `
                ${isAdmin ? '<a href="admin.html" class="nav-button">Admin</a>' : ''}
                <a href="my_orders.html" class="nav-button">My Orders</a>
                <button id="logout-button">Logout</button>
            `;
            document.getElementById('logout-button').addEventListener('click', () => {
                localStorage.removeItem('token');
                window.location.href = 'index.html';
            });
        } else {
            userNav.innerHTML = `<a href="login.html" class="nav-button">Login</a>
                                <a href="register.html" class="nav-button">Register</a>
                            `;
        }
    };
    
    const displayMenu = (items) => {
        menuContainer.innerHTML = '';
        items.forEach(item => {
            if (item.is_available) {
                const menuItemDiv = document.createElement('div');
                menuItemDiv.className = 'menu-item';
                menuItemDiv.innerHTML = `<h3>${item.name}</h3><p>Price: ₹${item.price.toFixed(2)}</p><button class="add-to-cart-btn" data-id="${item.id}">Add to Cart</button>`;
                menuContainer.appendChild(menuItemDiv);
            }
        });
    };
    
    const renderCart = () => {
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            cartTotalPriceEl.textContent = '0.00';
            return;
        }
        let totalPrice = 0;
        cart.forEach(item => {
            const cartItemDiv = document.createElement('div');
            cartItemDiv.className = 'cart-item';
            cartItemDiv.innerHTML = `<div class="cart-item-details"><span>${item.name}</span><span>₹${(item.price * item.quantity).toFixed(2)}</span></div><div class="cart-item-controls"><button class="quantity-btn decrement-btn" data-id="${item.id}">-</button><span class="item-quantity">${item.quantity}</span><button class="quantity-btn increment-btn" data-id="${item.id}">+</button></div>`;
            cartItemsContainer.appendChild(cartItemDiv);
            totalPrice += item.price * item.quantity;
        });
        cartTotalPriceEl.textContent = totalPrice.toFixed(2);
    };

    // --- Data & Logic Functions ---
    const fetchMenu = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/menu`);
            if (!response.ok) throw new Error('Failed to fetch menu');
            allMenuItems = await response.json();
            displayMenu(allMenuItems);
        } catch (error) {
            menuContainer.innerHTML = '<p>Failed to load menu.</p>';
        }
    };

    const updateCartQuantity = (itemId, change) => {
        const itemToAdd = allMenuItems.find(item => item.id === itemId);
        if (!itemToAdd) return;
        
        let itemInCart = cart.find(item => item.id === itemId);
        
        if (itemInCart) {
            itemInCart.quantity += change;
        } else if (change > 0) {
            cart.push({ id: itemToAdd.id, name: itemToAdd.name, price: itemToAdd.price, quantity: 1 });
        }
        
        cart = cart.filter(item => item.quantity > 0);
        renderCart();
    };

    const placeOrder = async () => {
    const currentToken = localStorage.getItem('token');

    // Guard clause in case the token is missing
    if (!currentToken) {
        alert('Authentication error. Please log in again.');
        window.location.href = 'login.html';
        return;
    }

    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    placeOrderBtn.disabled = true;
    
    const orderData = { items: cart.map(item => ({ menu_item_id: item.id, quantity: item.quantity })) };
    
    try {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${currentToken}` 
            },
            body: JSON.stringify(orderData)
        });

        if (response.status === 401) {
             throw new Error('Your session has expired. Please log in again.');
        }
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to place order');
        }
        
        alert('Order placed successfully!'); 
        cart = [];
        renderCart();
        
    } catch (error) {
        alert(`Error: ${error.message}`);
    } finally {
        placeOrderBtn.disabled = false;
    }
};

    // --- Event Listeners ---
    menuContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('add-to-cart-btn')) {
            if (!token) {
                alert('Please log in to add items to your cart.');
                window.location.href = 'login.html';
                return;
            }
            const itemId = parseInt(event.target.dataset.id);
            updateCartQuantity(itemId, 1);
        }
    });

    cartItemsContainer.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('quantity-btn')) {
            const itemId = parseInt(target.dataset.id);
            const change = target.classList.contains('increment-btn') ? 1 : -1;
            updateCartQuantity(itemId, change);
        }
    });

    placeOrderBtn.addEventListener('click', placeOrder);

    // --- Initial Page Load ---
    updateUserNavigation();
    fetchMenu();
});