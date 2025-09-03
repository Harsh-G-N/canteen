document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://canteen-4yw2.onrender.com'; // Your live URL
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

    const getStatusClass = (status) => {
    switch (status) {
        case 'Awaiting Approval': return 'status-pending';
        case 'Confirmed': return 'status-confirmed';
        case 'Completed': return 'status-completed';
        case 'Cancelled': return 'status-cancelled';
        default: return '';
    }
    };

    const fetchMyOrders = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/orders`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch orders');

            const orders = await response.json();
            displayGroupedOrders(orders, ordersContainer);

        } catch (error) {
            ordersContainer.innerHTML = '<p>Could not load your orders.</p>';
            console.error('Error fetching orders:', error);
        }
    };

    // This is the new function. You will use it in both my_orders.js and admin.js
const displayGroupedOrders = (orders, container, is_admin_view = false) => {
    if (orders.length === 0) {
        container.innerHTML = '<p>No orders found.</p>';
        return;
    }

    // Step 1: Group orders by date
    const ordersByDate = orders.reduce((acc, order) => {
        const orderDate = new Date(order.order_date).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        if (!acc[orderDate]) {
            acc[orderDate] = [];
        }
        acc[orderDate].push(order);
        return acc;
    }, {});

    // Step 2: Build the HTML string
    let html = '';
    for (const date in ordersByDate) {
        html += `<h2 class="date-header">${date}</h2>`;
        const dailyOrders = ordersByDate[date];
        const totalDailyOrders = dailyOrders.length;

        dailyOrders.forEach((order, index) => {
            const customerOrderNumber = totalDailyOrders - index;
            const statusDropdown = `
                <div class="order-status-updater">
                    <label for="status-${order.order_id}">Status:</label>
                    <select class="status-select" data-order-id="${order.order_id}">
                        <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>`;

            html += `
                <div class="order-card">
                    <div class="order-header">
                        <h4>Order #${order.daily_order_id} 
                            ${!is_admin_view ? `<span class="customer-order-count">(Your ${customerOrderNumber}st Order)</span>` : ''}
                        </h4>
                        <span class="order-status ${getStatusClass(order.status)}">${order.status}</span>
                    </div>
                    <div class="order-details">
                        <p><strong>Time:</strong> ${new Date(order.order_date).toLocaleTimeString('en-IN')}</p>
                        <p><strong>Total:</strong> ₹${order.total_amount.toFixed(2)}</p>
                    </div>
                    <h5>Items:</h5>
                    <ul class="order-items-list">
                        ${order.items.map(item => `<li>${item.menu_item_name} (x${item.quantity})</li>`).join('')}
                    </ul>
                    ${is_admin_view ? statusDropdown : ''}
                </div>
            `;
        });
    }

    container.innerHTML = html;
};

    fetchMyOrders();
});