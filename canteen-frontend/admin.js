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

    const ordersContainer = document.getElementById('admin-orders-container');

    const fetchAllOrders = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/admin/orders', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // This is our client-side authorization check
            if (response.status === 403) {
                alert('Access Denied: You must be an admin to view this page.');
                window.location.href = 'menu.html';
                return;
            }
            if (!response.ok) throw new Error('Failed to fetch orders');

            const orders = await response.json();
            displayOrders(orders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            ordersContainer.innerHTML = '<p>Could not load orders.</p>';
        }
    };

    const displayOrders = (orders) => {
        if (orders.length === 0) {
            ordersContainer.innerHTML = '<p>No orders have been placed yet.</p>';
            return;
        }

        ordersContainer.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <h4>Order #${order.order_id}</h4>
                </div>
                <div class="order-details">
                    <p><strong>Date:</strong> ${new Date(order.order_date).toLocaleString()}</p>
                    <p><strong>Total:</strong> ₹${order.total_amount.toFixed(2)}</p>
                </div>
                <h5>Items:</h5>
                <ul class="order-items-list">
                    ${order.items.map(item => `<li>${item.menu_item_name} (x${item.quantity})</li>`).join('')}
                </ul>
                <div class="order-status-updater">
                    <label for="status-${order.order_id}">Status:</label>
                    <select class="status-select" data-order-id="${order.order_id}">
                        <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
            </div>
        `).join('');
    };
    
    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/admin/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (!response.ok) throw new Error('Failed to update status');
            // Optionally, show a success message
            console.log(`Order ${orderId} status updated to ${newStatus}`);
        } catch (error) {
            alert('Error updating order status. Please try again.');
            console.error('Update Error:', error);
        }
    };
    
    // Event listener for status changes using event delegation
    ordersContainer.addEventListener('change', (event) => {
        if (event.target.classList.contains('status-select')) {
            const orderId = event.target.dataset.orderId;
            const newStatus = event.target.value;
            updateOrderStatus(orderId, newStatus);
        }
    });

    fetchAllOrders();
});