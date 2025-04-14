var PRODUCTS_KEY = 'eshop_products';
var CATEGORIES_KEY = 'eshop_categories';
var ORDERS_KEY = 'eshop_orders';
var CART_KEY = 'eshop_cart';

// Check Authentication
const currentUser = checkAuth();
if (!currentUser || currentUser.role !== 'admin') {
    window.location.href = '../index.html';
}

// Initialize Data
function initializeData() {
    if (!localStorage.getItem(PRODUCTS_KEY)) {
        localStorage.setItem(PRODUCTS_KEY, '[]');
    }   
    if (!localStorage.getItem(CATEGORIES_KEY)) {
        localStorage.setItem(CATEGORIES_KEY, '[]');
    }
    if (!localStorage.getItem(ORDERS_KEY)) {
        localStorage.setItem(ORDERS_KEY, '[]');
    }
    if (!localStorage.getItem(USERS_KEY)) {
        localStorage.setItem(USERS_KEY, JSON.stringify([{
            id: 1,
            email: 'admin@eshop.com',
            password: 'admin123',
            role: 'admin'
        }]));
    }
    if (!localStorage.getItem(CART_KEY)) {
        localStorage.setItem(CART_KEY, '[]');
    }
}

// Call initializeData at the start
initializeData();

// Product Management
function loadProducts() {
    const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY));
    const tbody = document.querySelector('#productsTable tbody');
    tbody.innerHTML = '';

    products.forEach(product => {
        tbody.innerHTML += `
            <tr>
                <td>${product.id}</td>
                <td><img src="${product.image}" alt="${product.name}" width="50"></td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>$${product.price}</td>
                <td>${product.stock}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editProduct(${product.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

function showAlert(message, type = 'success') {
    const alertPlaceholder = document.getElementById('alertPlaceholder');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    alertPlaceholder.append(wrapper);
    setTimeout(() => wrapper.remove(), 3000);
}

function saveProduct() {
    const productForm = document.getElementById('productForm');
    const errorMessages = [];

    // Reset validation state
    productForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

    // Get form values
    const productId = document.getElementById('productId').value;
    const name = document.getElementById('productName').value.trim();
    const image = document.getElementById('productImage').value.trim();
    const category = document.getElementById('productCategory').value;
    const priceStr = document.getElementById('productPrice').value;
    const stockStr = document.getElementById('productStock').value;
    const description = document.getElementById('productDescription').value.trim();

    // Validate product name
    if (!name) {
        errorMessages.push('Product name is required');
        document.getElementById('productName').classList.add('is-invalid');
    } else if (name.length < 3) {
        errorMessages.push('Product name must be at least 3 characters long');
        document.getElementById('productName').classList.add('is-invalid');
    }

    // Validate image URL
    if (!image) {
        errorMessages.push('Product image URL is required');
        document.getElementById('productImage').classList.add('is-invalid');
    } else {
        try {
            new URL(image);
        } catch (e) {
            errorMessages.push('Please enter a valid image URL');
            document.getElementById('productImage').classList.add('is-invalid');
        }
    }

    // Validate category
    if (!category) {
        errorMessages.push('Please select a category');
        document.getElementById('productCategory').classList.add('is-invalid');
    }

    // Validate price
    const price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0 || !/^\d+(\.\d{1,2})?$/.test(priceStr)) {
        errorMessages.push('Please enter valid price (max 2 decimals)');
        document.getElementById('productPrice').classList.add('is-invalid');
    }

    // Validate stock
    const stock = parseInt(stockStr);
    if (isNaN(stock) || stock < 0 || !/^\d+$/.test(stockStr)) {
        errorMessages.push('Stock must be whole number ≥ 0');
        document.getElementById('productStock').classList.add('is-invalid');
    }

    if (errorMessages.length > 0) {
        productForm.classList.add('was-validated');
        showAlert(errorMessages.join('<br>'), 'danger');
        return;
    }

    try {
        const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');

        // Check for duplicate product names
        const existingProduct = products.find(p => 
            p.name.toLowerCase() === name.toLowerCase() && 
            (!productId || p.id !== parseInt(productId))
        );

        if (existingProduct) {
            showAlert('A product with this name already exists', 'danger');
            return;
        }

        const product = {
            id: productId ? parseInt(productId) : products.length + 1,
            name,
            image,
            category,
            price,
            stock,
            description
        };

        if (productId) {
            const index = products.findIndex(p => p.id === parseInt(productId));
            products[index] = product;
            showAlert('Product updated successfully');
        } else {
            products.push(product);
            showAlert('Product added successfully');
        }

        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
        localStorage.setItem('eshop_last_update', new Date().toISOString());
        const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
        if (modal) {
            modal.hide();
            productForm.reset();
            productForm.classList.remove('was-validated');
        }
        loadProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        showAlert('Failed to save product. Please try again.', 'danger');
    }
}

function editProduct(id) {
    const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY));
    const product = products.find(p => p.id === id);
    if (product) {
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productImage').value = product.image;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productDescription').value = product.description;
        new bootstrap.Modal(document.getElementById('productModal')).show();
    }
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY));
            const product = products.find(p => p.id === id);
            if (!product) {
                showAlert('Product not found', 'danger');
                return;
            }
            const filteredProducts = products.filter(p => p.id !== id);
            localStorage.setItem(PRODUCTS_KEY, JSON.stringify(filteredProducts));
            showAlert('Product deleted successfully', 'success');
            loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            showAlert('Failed to delete product. Please try again.', 'danger');
        }
    }
}

// Category Management
function loadCategories() {
    const categories = JSON.parse(localStorage.getItem(CATEGORIES_KEY));
    const tbody = document.querySelector('#categoriesTable tbody');
    const select = document.getElementById('productCategory');
    
    tbody.innerHTML = '';
    select.innerHTML = '<option value="">Select Category</option>';

    categories.forEach(category => {
        tbody.innerHTML += `
            <tr>
                <td>${category.id}</td>
                <td>${category.name}</td>
                <td>
                    <button type="button" class="btn btn-sm btn-primary" onclick="editCategory(${category.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCategory(${category.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        select.innerHTML += `<option value="${category.name}">${category.name}</option>`;
    });
}

document.getElementById('categoryForm').addEventListener('submit', saveCategory);

function saveCategory() {
    const categoryForm = document.getElementById('categoryForm');
    if (!categoryForm.checkValidity()) {
        categoryForm.classList.add('was-validated');
        showAlert('Please fill in all required fields correctly', 'danger');
        return false;
    }

    try {
        const categories = JSON.parse(localStorage.getItem(CATEGORIES_KEY) || '[]');
        const categoryId = document.getElementById('categoryId').value;
        const categoryName = document.getElementById('categoryName').value.trim();

        if (!categoryName || categoryName.length < 2) {
            showAlert('Category name must be at least 2 characters long', 'danger');
            return;
        }

        if (categoryName.length > 50) {
            showAlert('Category name cannot exceed 50 characters', 'danger');
            return;
        }

        // Check if category name already exists
        const existingCategory = categories.find(c => 
            c.name.toLowerCase() === categoryName.toLowerCase() && 
            (!categoryId || c.id !== parseInt(categoryId))
        );

        if (existingCategory) {
            showAlert('Category name already exists', 'danger');
            return;
        }

        // Validate category ID if provided
        if (categoryId && isNaN(parseInt(categoryId))) {
            showAlert('Invalid category ID', 'danger');
            return;
        }

        const category = {
            id: categoryId ? parseInt(categoryId) : Math.max(0, ...categories.map(c => c.id)) + 1,
            name: categoryName
        };

        if (categoryId) {
            const index = categories.findIndex(c => c.id === parseInt(categoryId));
            if (index !== -1) {
                categories[index] = category;
                showAlert('Category updated successfully');
            } else {
                categories.push(category);
                showAlert('Category added successfully');
            }
        } else {
            categories.push(category);
            showAlert('Category added successfully');
        }

        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
        loadCategories();

        const modal = bootstrap.Modal.getInstance(document.getElementById('categoryModal'));
        if (modal) {
            categoryForm.reset();
            categoryForm.classList.remove('was-validated');
            document.getElementById('categoryId').value = '';
            modal.hide();
        }
    } catch (error) {
        console.error('Error saving category:', error);
        showAlert('Failed to save category. Please try again.', 'danger');
    }
}

function editCategory(id) {
    const categories = JSON.parse(localStorage.getItem(CATEGORIES_KEY));
    const category = categories.find(c => c.id === id);
    if (category) {
        document.getElementById('categoryId').value = category.id;
        document.getElementById('categoryName').value = category.name;
        new bootstrap.Modal(document.getElementById('categoryModal')).show();
    }
}

function deleteCategory(id) {
    if (confirm('Are you sure you want to delete this category?')) {
        try {
            const categories = JSON.parse(localStorage.getItem(CATEGORIES_KEY));
            const category = categories.find(c => c.id === id);
            if (!category) {
                showAlert('Category not found', 'danger');
                return;
            }
            const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY));
            const productsWithCategory = products.filter(p => p.category === category.name);
            if (productsWithCategory.length > 0) {
                showAlert('Cannot delete category. There are products using this category.', 'danger');
                return;
            }
            const filteredCategories = categories.filter(c => c.id !== id);
            localStorage.setItem(CATEGORIES_KEY, JSON.stringify(filteredCategories));
            showAlert('Category deleted successfully', 'success');
            loadCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            showAlert('Failed to delete category. Please try again.', 'danger');
        }
    }
}

// Order Management
function loadOrders() {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const tbody = document.querySelector('#ordersTable tbody');
    tbody.innerHTML = '';

    orders.forEach(order => {
        tbody.innerHTML += `
            <tr>
                <td>${order.id}</td>
                <td>${order.customerEmail}</td>
                <td>${new Date(order.date).toLocaleDateString()}</td>
                <td>$${order.total.toFixed(2)}</td>
                <td>
                    <span class="badge bg-${order.status === 'pending' ? 'warning' : 
                        order.status === 'confirmed' ? 'success' : 'danger'}">
                        ${order.status}
                    </span>
                </td>
                <td>
                    ${order.status === 'pending' ? `
                        <button class="btn btn-sm btn-success" onclick="updateOrderStatus(${order.id}, 'confirmed')">
                            <i class="bi bi-check-lg"></i> Confirm
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="updateOrderStatus(${order.id}, 'rejected')">
                            <i class="bi bi-x-lg"></i> Reject
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });
}

function updateOrderStatus(orderId, status) {
    try {
        const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            showAlert('Order not found', 'danger');
            return;
        }

        const order = orders[orderIndex];
        
        // Only process if status is changing
        if (order.status === status) return;

        // Restore stock if order is rejected
        if (status === 'rejected') {
            const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
            order.items.forEach(item => {
                const productIndex = products.findIndex(p => p.id === item.productId);
                if (productIndex !== -1) {
                    products[productIndex].stock += item.quantity;
                }
            });
            localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
        }

        // Update order status
        orders[orderIndex].status = status;
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        
        showAlert(`Order ${status} successfully`, 'success');
        loadOrders();
    } catch (error) {
        console.error('Error updating order status:', error);
        showAlert('Failed to update order status', 'danger');
    }
}

// Admin Management
 function saveAdmin() {
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value.trim();
    
    const form = document.getElementById('adminForm');
    form.classList.add('was-validated');
    
    // Clear previous validation states
    document.getElementById('adminEmail').classList.remove('is-invalid');
    document.getElementById('adminPassword').classList.remove('is-invalid');
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        document.getElementById('adminEmail').classList.add('is-invalid');
        showAlert('Please enter a valid email address', 'danger');
        return;
    }

    // Password validation
    if (password.length < 6) {
        document.getElementById('adminPassword').classList.add('is-invalid');
        showAlert('Password must be at least 6 characters long', 'danger');
        return;
    }

    try {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        
        // Case-insensitive email check
        if (users.some(user => user.email.toLowerCase() === email.toLowerCase())) {
            showAlert('User with this email already exists', 'warning');
            document.getElementById('adminEmail').classList.add('is-invalid');
            return;
        }

        const newAdmin = {
            id: Date.now(),
            email,
            password,
            role: 'admin'
        };

        users.push(newAdmin);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        
        showAlert('Admin saved successfully', 'success');
        form.reset();
        form.classList.remove('was-validated');
        const modal = bootstrap.Modal.getInstance(document.getElementById('adminModal'));
        if (modal) modal.hide();
        loadAdmins();
    } catch (error) {
        console.error('Error saving admin:', error);
        showAlert('Failed to save admin. Please try again.', 'danger');
    }
}

// Initialize admin management
document.addEventListener('DOMContentLoaded', () => {
    loadAdmins();
    loadCategories();
    loadOrders();
    loadProducts();
    initializeData();
    
 
});


function loadAdmins() {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const tbody = document.querySelector('#adminsTable tbody');
    
    tbody.innerHTML = users
        .filter(user => user.role === 'admin')
        .map(admin => 
            `<tr>
                <td>${admin.id}</td>
                <td>${admin.email}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteAdmin(${admin.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>`
        ).join('');
}

 function deleteAdmin(id) {
    if (confirm('Are you sure you want to delete this admin?')) {
        let users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        users = users.filter(user => user.id !== id);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        loadAdmins();
        showAlert('Admin deleted successfully', 'success');
    }
}