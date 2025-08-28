document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('logout-button').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });

    const ordersContainer = document.getElementById('orders-container');

    const fetchMyOrders = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/orders', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch orders');

            const orders = await response.json();
            displayOrders(orders);

        } catch (error) {
            ordersContainer.innerHTML = '<p>Could not load your orders.</p>';
            console.error('Error fetching orders:', error);
        }
    };

    const displayOrders = (orders) => {
        if (orders.length === 0) {
            ordersContainer.innerHTML = '<p>You have not placed any orders yet.</p>';
            return;
        }

        ordersContainer.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <h4>Order #${order.order_id}</h4>
                    <span class="order-status">${order.status}</span>
                </div>
                <div class="order-details">
                    <p><strong>Date:</strong> ${new Date(order.order_date).toLocaleString()}</p>
                    <p><strong>Total:</strong> ₹${order.total_amount.toFixed(2)}</p>
                </div>
                <h5>Items:</h5>
                <ul class="order-items-list">
                    ${order.items.map(item => `
                        <li>${item.menu_item_name} (x${item.quantity})</li>
                    `).join('')}
                </ul>
            </div>
        `).join('');
    };

    fetchMyOrders();
});