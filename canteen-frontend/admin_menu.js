document.addEventListener('DOMContentLoaded', () => {

    // --- Auth Check ---
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return; }

    // --- Element Refs ---
    const menuListContainer = document.getElementById('menu-list-container');
    const addItemForm = document.getElementById('add-item-form');
    const editModal = document.getElementById('edit-modal');
    const editItemForm = document.getElementById('edit-item-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    
    let allMenuItems = []; // To store menu data for editing

    // --- API Functions ---
    const fetchAndDisplayMenu = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/menu`);
            if (!response.ok) throw new Error('Failed to fetch menu');
            allMenuItems = await response.json();
            
            menuListContainer.innerHTML = allMenuItems.map(item => `
                <div class="menu-list-item">
                    <span><strong>${item.name}</strong> - ₹${item.price.toFixed(2)} (${item.is_available ? 'Available' : 'Unavailable'})</span>
                    <div class="item-actions">
                        <button class="edit-btn" data-id="${item.id}">Edit</button>
                        <button class="delete-btn" data-id="${item.id}">Delete</button>
                    </div>
                </div>
            `).join('');
        } catch (error) { console.error('Error:', error); }
    };

    const handleAddItem = async (event) => {
        event.preventDefault();
        const newItem = {
            name: document.getElementById('name').value,
            price: parseFloat(document.getElementById('price').value),
            is_available: document.getElementById('is_available').checked,
        };
        try {
            const response = await fetch(`${API_BASE_URL}/api/menu`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newItem)
            });
            if (!response.ok) throw new Error('Failed to add item');
            addItemForm.reset();
            fetchAndDisplayMenu(); // Refresh the list
        } catch (error) { console.error('Error:', error); alert('Failed to add item.'); }
    };

    const handleDeleteItem = async (itemId) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/menu/${itemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to delete item');
            fetchAndDisplayMenu(); // Refresh the list
        } catch (error) { console.error('Error:', error); alert('Failed to delete item.'); }
    };
    
    const openEditModal = (itemId) => {
        const item = allMenuItems.find(i => i.id === itemId);
        if (!item) return;
        document.getElementById('edit-id').value = item.id;
        document.getElementById('edit-name').value = item.name;
        document.getElementById('edit-price').value = item.price;
        document.getElementById('edit-is_available').checked = item.is_available;
        editModal.classList.remove('hidden');
    };

    const handleEditItem = async (event) => {
        event.preventDefault();
        const itemId = document.getElementById('edit-id').value;
        const updatedItem = {
            name: document.getElementById('edit-name').value,
            price: parseFloat(document.getElementById('edit-price').value),
            is_available: document.getElementById('edit-is_available').checked,
        };
        try {
            const response = await fetch(`${API_BASE_URL}/api/menu/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updatedItem)
            });
            if (!response.ok) throw new Error('Failed to update item');
            editModal.classList.add('hidden');
            fetchAndDisplayMenu(); // Refresh the list
        } catch (error) { console.error('Error:', error); alert('Failed to update item.'); }
    };

    // --- Event Listeners ---
    document.getElementById('logout-button').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });
    
    addItemForm.addEventListener('submit', handleAddItem);
    
    menuListContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            handleDeleteItem(parseInt(event.target.dataset.id));
        }
        if (event.target.classList.contains('edit-btn')) {
            openEditModal(parseInt(event.target.dataset.id));
        }
    });
    
    editItemForm.addEventListener('submit', handleEditItem);
    cancelEditBtn.addEventListener('click', () => editModal.classList.add('hidden'));

    // --- Initial Load ---
    fetchAndDisplayMenu();
});