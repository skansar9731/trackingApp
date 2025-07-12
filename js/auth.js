// User roles
const ROLES = {
    ADMIN: 'admin',
    CUSTOMER: 'customer'
};

// Initialize localStorage data structure if not exists
if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([]));
}

if (!localStorage.getItem('orders')) {
    localStorage.setItem('orders', JSON.stringify([]));
}

// Create default admin (for first-time setup)
const users = JSON.parse(localStorage.getItem('users'));
if (!users.some(user => user.role === ROLES.ADMIN)) {
    users.push({
        id: 'admin',
        username: 'admin',
        password: 'admin123',
        role: ROLES.ADMIN,
        name: 'Administrator'
    });
    localStorage.setItem('users', JSON.stringify(users));
}

// Login function
// Login function
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(
    u => u.username === username && u.password === password && u.role === ROLES.CUSTOMER
);
    
    if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        if (user.role === ROLES.ADMIN) {
            window.location.href = 'admin.html';
        } else if (user.role === ROLES.CUSTOMER) {
            window.location.href = 'customer-login.html';
        }
    } else {
        document.getElementById('loginError').textContent = 'Invalid username or password';
    }
});

// Logout function
document.getElementById('logoutBtn')?.addEventListener('click', function() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
});

// Check authentication on page load
// Toggle mobile menu
function toggleMenu() {
    const navLinks = document.getElementById('navLinks');
    const navRight = document.getElementById('navRight');
    
    // Close if already open
    if (navLinks.classList.contains('show')) {
        navLinks.classList.remove('show');
        navRight.classList.remove('show');
        document.body.style.overflow = 'auto';
        return;
    }
    
    // Open menu
    navLinks.classList.add('show');
    navRight.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Close menu when clicking outside
document.addEventListener('click', function(event) {
    const navLinks = document.getElementById('navLinks');
    const navRight = document.getElementById('navRight');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (!event.target.closest('.nav-container') && 
        !event.target.classList.contains('menu-toggle')) {
        navLinks.classList.remove('show');
        navRight.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
});

// Close menu on resize if screen gets larger
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        const navLinks = document.getElementById('navLinks');
        const navRight = document.getElementById('navRight');
        navLinks.classList.remove('show');
        navRight.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
});
// Add this to auth.js to handle both login forms
document.addEventListener('DOMContentLoaded', function() {
    // Admin login form handler
    document.getElementById('loginForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin('admin');
    });
    
    // Customer login form handler
    // Customer login handler
document.getElementById('customerLoginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('customerUsername').value;
    const password = document.getElementById('customerPassword').value;
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.username === username && u.password === password && u.role === 'customer');
        if (!currentUser) {
        window.location.href = 'customer-login.html';
        return;
    }
    if (currentUser.role !== 'customer') {
        window.location.href = 'index.html';
        return;
    }
    if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        window.location.href = 'customer-login.html'; // Explicit redirect
        return; // Stop further execution
    }
    document.getElementById('customerLoginError').textContent = 'Invalid credentials';
});
});

function handleLogin(role) {
    const formId = role === 'admin' ? 'loginForm' : 'customerLoginForm';
    const usernameField = role === 'admin' ? 'username' : 'customerUsername';
    const passwordField = role === 'admin' ? 'password' : 'customerPassword';
    const errorField = role === 'admin' ? 'loginError' : 'customerLoginError';
    
    const username = document.getElementById(usernameField).value;
    const password = document.getElementById(passwordField).value;
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.username === username && u.password === password && u.role === role);
    
    if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        window.location.href = role === 'admin' ? 'admin.html' : 'customer-login.html';
    } else {
        document.getElementById(errorField).textContent = `Invalid ${role} credentials`;
    }
}