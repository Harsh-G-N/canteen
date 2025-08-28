function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Get Elements and Check Token ---
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    if (token) {
        const user = parseJwt(token);
        if (user && user.role === 'admin') {
            const headerDiv = document.querySelector('header div');
            const adminLink = document.createElement('a');
            adminLink.href = 'admin.html';
            adminLink.textContent = 'Admin Dashboard';
            adminLink.className = 'nav-button';
            // Insert it before the "My Orders" link
            headerDiv.insertBefore(adminLink, headerDiv.firstChild);
        }
    }

    const menuContainer = document.getElementById('menu-container');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPriceEl = document.getElementById('cart-total-price');
    const placeOrderBtn = document.getElementById('place-order-btn');
    const logoutButton = document.getElementById('logout-button');

    // --- State Management ---
    let cart = []; // Our cart will be an array of item objects

    // --- Logout ---
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });

    // --- Core Functions ---
    const fetchMenu = async () => {
        // ... (this function is the same as before)
        try {
            const response = await fetch('http://127.0.0.1:5000/api/menu');
            if (!response.ok) throw new Error('Failed to fetch menu');
            const menuItems = await response.json();
            displayMenu(menuItems);
        } catch (error) {
            menuContainer.innerHTML = '<p>Failed to load menu.</p>';
            console.error('Error fetching menu:', error);
        }
    };

    const displayMenu = (items) => {
        // ... (this function is the same as before)
        menuContainer.innerHTML = '';
        items.forEach(item => {
            if (item.is_available) {
                const menuItemDiv = document.createElement('div');
                menuItemDiv.className = 'menu-item';
                menuItemDiv.innerHTML = `
                    <h3>${item.name}</h3>
                    <p>Price: ₹${item.price.toFixed(2)}</p>
                    <button class="add-to-cart-btn" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">Add to Cart</button>
                `;
                menuContainer.appendChild(menuItemDiv);
            }
        });
    };

    const addToCart = (itemId, itemName, itemPrice) => {
        // Find if item already exists in cart
        const existingItem = cart.find(item => item.id === itemId);

        if (existingItem) {
            // If it exists, just increase the quantity
            existingItem.quantity++;
        } else {
            // If not, add it as a new item
            cart.push({
                id: itemId,
                name: itemName,
                price: itemPrice,
                quantity: 1
            });
        }
        // Update the cart display
        renderCart();
    };

    const renderCart = () => {
    cartItemsContainer.innerHTML = ''; // Clear current cart display

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
        cartTotalPriceEl.textContent = '0.00';
        return;
    }

    let totalPrice = 0;
    cart.forEach(item => {
        const cartItemDiv = document.createElement('div');
        cartItemDiv.className = 'cart-item';

        // MODIFIED: Replaced the 'Remove' button with quantity controls
        cartItemDiv.innerHTML = `
            <div class="cart-item-details">
                <span>${item.name}</span>
                <span>₹${(item.price * item.quantity).toFixed(2)}</span>
            </div>
            <div class="cart-item-controls">
                <button class="quantity-btn decrement-btn" data-id="${item.id}">-</button>
                <span class="item-quantity">${item.quantity}</span>
                <button class="quantity-btn increment-btn" data-id="${item.id}">+</button>
            </div>
        `;
        
        cartItemsContainer.appendChild(cartItemDiv);
        totalPrice += item.price * item.quantity;
    });

    cartTotalPriceEl.textContent = totalPrice.toFixed(2);
    };

    const placeOrder = async () => {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        // Format the cart data for the backend
        const orderData = {
            items: cart.map(item => ({
                menu_item_id: item.id,
                quantity: item.quantity
            }))
        };

        try {
            const response = await fetch('http://127.0.0.1:5000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Send the token for authentication
                },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to place order');
            }

            alert('Order placed successfully!');
            cart = []; // Clear the cart
            renderCart(); // Re-render the empty cart display

        } catch (error) {
            alert(`Error: ${error.message}`);
            console.error('Error placing order:', error);
        }
    };

    const updateCartQuantity = (itemId, change) => {
    const itemInCart = cart.find(item => item.id === itemId);

    if (itemInCart) {
        itemInCart.quantity += change;

        // If quantity drops to 0 or below, remove the item entirely
        if (itemInCart.quantity <= 0) {
            cart = cart.filter(item => item.id !== itemId);
        }
    }
    
    // Update the cart display
    renderCart();
    };


    // --- Event Listeners ---
    // Using event delegation for dynamically created "Add to Cart" buttons
    menuContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('add-to-cart-btn')) {
            const button = event.target;
            const itemId = parseInt(button.dataset.id);
            const itemName = button.dataset.name;
            const itemPrice = parseFloat(button.dataset.price);
            addToCart(itemId, itemName, itemPrice);
        }
    });

    // Add this event listener to the bottom of your menu.js, right before the initial fetchMenu() call
    cartItemsContainer.addEventListener('click', (event) => {
    const target = event.target;
    const itemId = parseInt(target.dataset.id);

    if (target.classList.contains('increment-btn')) {
        updateCartQuantity(itemId, 1); // Increase by 1
    }

    if (target.classList.contains('decrement-btn')) {
        updateCartQuantity(itemId, -1); // Decrease by 1
    }
    });

    placeOrderBtn.addEventListener('click', placeOrder);

    // --- Initial Load ---
    fetchMenu();
});

