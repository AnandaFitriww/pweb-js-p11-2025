document.addEventListener('DOMContentLoaded', () => {
    const userFirstName = localStorage.getItem('userFirstName');

    if (!userFirstName) {
        const blocker = document.getElementById('auth-blocker');
        const loginBtn = document.getElementById('goto-login-btn');
        
        if (blocker) {
            blocker.classList.remove('hidden');
        }

        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
    }
});