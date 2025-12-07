document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://16.112.15.225:5000'; // Your live URL
    // --- Auth Check ---
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return; }

    // --- Element Refs ---
    const reportForm = document.getElementById('report-form');
    const reportResults = document.getElementById('report-results');
    const totalRevenueEl = document.getElementById('total-revenue');
    const totalOrdersEl = document.getElementById('total-orders');
    const salesBreakdownBody = document.getElementById('sales-breakdown');
    
    // Set default dates to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('start-date').value = today;
    document.getElementById('end-date').value = today;

    // --- Event Listeners ---
    document.getElementById('logout-button').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });

    reportForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/reports/sales?start_date=${startDate}&end_date=${endDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 403) {
                alert('Access Denied'); window.location.href = 'index.html'; return;
            }
            if (!response.ok) throw new Error('Failed to generate report');

            const reportData = await response.json();
            displayReport(reportData);

        } catch (error) { console.error('Error:', error); alert('Could not generate report.'); }
    });

    const displayReport = (data) => {
        // Display summary
        totalRevenueEl.textContent = `₹${data.summary.total_revenue.toFixed(2)}`;
        totalOrdersEl.textContent = data.summary.total_orders;

        // Display item breakdown
        salesBreakdownBody.innerHTML = ''; // Clear previous data
        if (data.item_breakdown.length === 0) {
            salesBreakdownBody.innerHTML = '<tr><td colspan="2">No items sold in this period.</td></tr>';
        } else {
            data.item_breakdown.forEach(item => {
                const row = `<tr><td>${item.name}</td><td>${item.quantity}</td></tr>`;
                salesBreakdownBody.innerHTML += row;
            });
        }
        
        reportResults.classList.remove('hidden'); // Show the results section
    };
});