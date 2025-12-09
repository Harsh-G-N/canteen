// Get the form element
const loginForm = document.getElementById('login-form');
const errorMessageDiv = document.getElementById('error-message');

// Add an event listener for the form submission
loginForm.addEventListener('submit', async (event) => {
    // Prevent the default form submission which reloads the page
    event.preventDefault();

    // Clear any previous error messages
    errorMessageDiv.textContent = '';

    // Get the values from the input fields
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Send the data to your backend API
    try {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Login was successful
            // Store the token in the browser's local storage
            localStorage.setItem('token', data.access_token);
            
            // Redirect to the menu page (we will create this next)
            window.location.href = 'index.html';
        } else {
            // Login failed, show an error message
            errorMessageDiv.textContent = data.message || 'Login failed!';
        }
    } catch (error) {
        // Network error or other issue
        errorMessageDiv.textContent = 'An error occurred. Please try again.';
        console.error('Login Error:', error);
    }
});