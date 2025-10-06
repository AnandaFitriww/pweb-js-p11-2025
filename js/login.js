document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    const notification = document.getElementById('notification');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = usernameInput.value;
        const password = passwordInput.value;

        if (!password) {
            showNotification('Please fill out this field!', 'error');
            return;
        }

        loginButton.disabled = true;
        loginButton.textContent = 'LOADING...';
        showNotification('Logging in...', 'loading');

        try {
            const response = await fetch('https://dummyjson.com/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username,
                    password: password,
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Invalid username or password!');
            }

            showNotification('Login success!', 'success');

            localStorage.setItem('userFirstName', data.firstName);
            localStorage.setItem('userToken', data.token);
            localStorage.setItem('currentUsername', data.username);

            setTimeout(() => {
                window.location.href = 'recipes.html';
            }, 2000);

        } catch (error) {
            console.error('Login failed:', error);
            showNotification(error.message, 'error');
            loginButton.disabled = false;
            loginButton.textContent = 'SIGN IN';
        }
    });

    function showNotification(message, type) {
        notification.textContent = message;
        notification.className = `notification ${type}`;
    }
});