// Local Storage Keys
const USERS_KEY = 'eshop_users';
const CURRENT_USER_KEY = 'eshop_current_user';

// Initialize default admin if not exists
function initializeAdmin() {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (!users.find(user => user.role === 'admin')) {
        users.push({
            id: 1,
            email: 'admin@eshop.com',
            password: 'admin123',
            role: 'admin'
        });
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
}

// Form Validation
function validateForm(form) {
    let isValid = true;
    let errorMessages = [];

    form.querySelectorAll('input').forEach(input => {
        // Add autocomplete attribute for password fields if missing
        if (input.type === 'password' && !input.getAttribute('autocomplete')) {
            if (input.id === 'confirmPassword') {
                input.setAttribute('autocomplete', 'new-password');
            } else {
                input.setAttribute('autocomplete', 'current-password');
            }
        }
        
        // Remove previous validation states
        input.classList.remove('is-invalid');
        
        // Check if empty
        if (input.required && !input.value.trim()) {
            input.classList.add('is-invalid');
            errorMessages.push(`${input.id.charAt(0).toUpperCase() + input.id.slice(1)} is required`);
            isValid = false;
            return;
        }

        // Email validation
        if (input.type === 'email' && input.value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value.trim())) {
                input.classList.add('is-invalid');
                errorMessages.push('Please enter a valid email address');
                isValid = false;
            }
        }

        // Password validation
        if (input.type === 'password' && input.value.trim()) {
            if (input.value.length < 6) {
                input.classList.add('is-invalid');
                errorMessages.push('Password must be at least 6 characters long');
                isValid = false;
            }
        }

        // Confirm password validation
        if (input.id === 'confirmPassword') {
            const password = document.getElementById('password');
            if (password && input.value !== password.value) {
                input.classList.add('is-invalid');
                errorMessages.push('Passwords do not match');
                isValid = false;
            }
        }
    });

    // Display error messages if any
    if (!isValid) {
        showAlert(errorMessages.join('<br>'), 'danger');
    }

    return isValid;
}

// Show Alert Message
function showAlert(message, type = 'danger') {
    const alertPlaceholder = document.querySelector('.alert-container') || document.querySelector('.card-body') || document.body;
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Simply append the alert to the placeholder
    alertPlaceholder.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Handle Login
function handleLogin(email, password, role) {
    try {
        if (!email || !password) {
            showAlert('Please enter both email and password');
            return;
        }

        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const userByEmail = users.find(u => u.email === email && u.role === role);
        
        if (!userByEmail) {
            showAlert('Invalid email or password');
            return;
        }

        if (userByEmail.password !== password) {
            showAlert('Invalid email or password');
            return;
        }

        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userByEmail));
        showAlert('Login successful!', 'success');
        setTimeout(() => {
            window.location.href = role === 'admin' ? 'admin/dashboard.html' : 'customer/products.html';
        }, 1500);

    } catch (error) {
        console.error('Login error:', error);
        showAlert('An error occurred during login. Please try again.');
    }
}

// Handle Registration
function handleRegister(fullName, email, password) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    if (users.find(u => u.email === email)) {
        showAlert('Email already exists');
        return;
    }
    
    const newUser = {
        id: users.length + 1,
        fullName,
        email,
        password,
        role: 'customer'
    };
    
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    showAlert('Registration successful! Please login.', 'success');
    setTimeout(() => window.location.href = 'index.html', 2000);
}

// Initialize Admin Account
initializeAdmin();

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const customerLoginForm = document.getElementById('customerLoginForm');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const registerForm = document.getElementById('registerForm');

    if (customerLoginForm) {
        customerLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateForm(customerLoginForm)) {
                const email = document.getElementById('customerEmail').value;
                const password = document.getElementById('customerPassword').value;
                handleLogin(email, password, 'customer');
            }
        });
    }

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateForm(adminLoginForm)) {
                const email = document.getElementById('adminEmail').value;
                const password = document.getElementById('adminPassword').value;
                handleLogin(email, password, 'admin');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateForm(registerForm)) {
                const fullName = document.getElementById('fullName').value;
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword').value;

                if (password !== confirmPassword) {
                    document.getElementById('confirmPassword').classList.add('is-invalid');
                    return;
                }

                handleRegister(fullName, email, password);
            }
        });
    }
});

// Logout Function
function logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.location.href = '../index.html';
}

// Check Authentication Status
function checkAuth() {
    const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
    if (!currentUser) {
        window.location.href = '../index.html';
        return null;
    }
    return currentUser;
}