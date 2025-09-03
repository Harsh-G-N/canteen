document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://canteen-4yw2.onrender.com'; // Your live URL
    const registerForm = document.getElementById('register-form');
    const errorMessageDiv = document.getElementById('error-message');

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorMessageDiv.textContent = '';

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_BASE_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Registration successful! Please log in with your new account.');
                window.location.href = 'login.html'; // Redirect to login page
            } else {
                errorMessageDiv.textContent = data.message || 'Registration failed!';
            }
        } catch (error) {
            errorMessageDiv.textContent = 'An error occurred. Please try again.';
            console.error('Registration Error:', error);
        }
    });
});