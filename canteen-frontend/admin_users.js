document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://16.112.15.225:5000'; // Your live URL
    // --- Auth Check ---
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return; }

    // --- Element Refs (MODIFIED) ---
    const adminUsersList = document.getElementById('admin-users-list');
    const customerUsersList = document.getElementById('customer-users-list');

    const fetchAndDisplayUsers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 403) {
                alert('Access Denied');
                window.location.href = 'index.html';
                return;
            }
            if (!response.ok) throw new Error('Failed to fetch users');
            
            const allUsers = await response.json();

            // MODIFIED: Filter the list into two groups
            const admins = allUsers.filter(user => user.role === 'admin');
            const customers = allUsers.filter(user => user.role === 'customer');

            // MODIFIED: Render each list into its own container
            renderUserList(adminUsersList, admins);
            renderUserList(customerUsersList, customers);

        } catch (error) { console.error('Error:', error); }
    };

    // NEW: A reusable function to render a list of users
    const renderUserList = (container, userList) => {
        if (userList.length === 0) {
            container.innerHTML = '<p>No users in this category.</p>';
            return;
        }
        container.innerHTML = userList.map(user => `
            <div class="user-list-item">
                <div class="user-details">
                    <strong>${user.name}</strong> (${user.email})
                </div>
                <div class="user-role">
                    <select class="user-role-select" data-user-id="${user.id}">
                        <option value="customer" ${user.role === 'customer' ? 'selected' : ''}>Customer</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </div>
            </div>
        `).join('');
    };

    const handleRoleChange = async (event) => {
    if (!event.target.classList.contains('user-role-select')) return;
    
    const selectElement = event.target;
    const userId = selectElement.dataset.userId;
    const newRole = selectElement.value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ role: newRole })
        });
        
        const data = await response.json(); // Read the JSON body

        if (!response.ok) {
            // If the response is not OK, use the message from the backend
            throw new Error(data.message || 'Failed to update role');
        }

        alert('User role updated successfully!');
    } catch (error) {
        console.error('Error:', error);
        alert(`Error: ${error.message}`);
        // This is important: refresh the list to revert the dropdown on failure
        fetchAndDisplayUsers(); 
    }
};

    // --- Event Listeners ---
    document.getElementById('logout-button').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });

    // MODIFIED: We listen on the parent card now since there are two lists
    document.querySelector('.card').addEventListener('change', handleRoleChange);
    
    // --- Initial Load ---
    fetchAndDisplayUsers();
});