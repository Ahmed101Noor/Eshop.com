// Import shared configuration
var PRODUCTS_KEY = 'eshop_products';
var CATEGORIES_KEY = 'eshop_categories';
var CART_KEY = 'eshop_cart';
var WISHLIST_KEY = 'eshop_wishlist';
var ORDERS_KEY = 'eshop_orders';  // Add this line

// Check Authentication
const currentUser = checkAuth();
if (currentUser?.role !== 'customer') {
    window.location.href = '../index.html';
}

// Initialize Data
function initializeCustomerData() {
    if (!localStorage.getItem(CART_KEY)) {
        localStorage.setItem(CART_KEY, JSON.stringify({}));
    }
    if (!localStorage.getItem(WISHLIST_KEY)) {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify([]));
    }
}

// Product Display and Filtering
function loadProducts() {
    const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    const categories = JSON.parse(localStorage.getItem(CATEGORIES_KEY) || '[]');
    const categoryFilter = document.getElementById('categoryFilter');
    const productsGrid = document.getElementById('productsGrid');

    // Load categories into filter
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(category => {
        categoryFilter.innerHTML += `<option value="${category.name}">${category.name}</option>`;
    });

    // Display products
    displayFilteredProducts(products);
}

function displayFilteredProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    const categoryFilter = document.getElementById('categoryFilter').value;
    const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
    const maxPrice = parseFloat(document.getElementById('maxPrice').value) || Infinity;

    // Apply filters
    const filteredProducts = products.filter(product => {
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        const matchesPrice = product.price >= minPrice && (!maxPrice || product.price <= maxPrice);
        return matchesCategory && matchesPrice;
    });

    // Display products
    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="col-md-4">
            <div class="card product-card h-100">
                <img src="${product.image}" class="card-img-top" alt="${product.name}">
                <div class="card-body">
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text">${product.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="h5 mb-0">$${product.price.toFixed(2)}</span>
                        <span class="text-muted">Stock: ${product.stock}</span>
                    </div>
                </div>
                <div class="card-footer bg-transparent border-top-0">
                    <div class="d-flex justify-content-between">
                        <button class="btn btn-primary" onclick="addToCart(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>
                            <i class="bi bi-cart-plus"></i> Add to Cart
                        </button>
                        <button class="btn btn-outline-primary" onclick="toggleWishlist(${product.id})">
                            <i class="bi bi-heart${isInWishlist(product.id) ? '-fill' : ''}"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function applyFilters() {
    const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    displayFilteredProducts(products);
}

// Cart Management
function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY) || '{}');
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
    updateCartDisplay();
}

function addToCart(productId) {
    try {
        const cart = getCart();
        const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
        const product = products.find(p => p.id === productId);

        if (!product) {
            showAlert('Product not found', 'danger');
            return;
        }

        if (product.stock === 0) {
            showAlert('Product is out of stock', 'danger');
            return;
        }

        const currentQuantity = cart[productId] || 0;
        if (currentQuantity >= product.stock) {
            showAlert('Cannot add more items than available in stock', 'danger');
            return;
        }

        cart[productId] = currentQuantity + 1;
        saveCart(cart);
        showAlert('Product added to cart successfully', 'success');
    } catch (error) {
        console.error('Error adding to cart:', error);
        showAlert('Failed to add product to cart', 'danger');
    }
}

function removeFromCart(productId) {
    try {
        const cart = getCart();
        if (cart[productId]) {
            delete cart[productId];
            saveCart(cart);
            showAlert('Item removed from cart', 'success');
        }
    } catch (error) {
        console.error('Error removing from cart:', error);
        showAlert('Failed to remove item from cart', 'danger');
    }
}

function updateCartQuantity(productId, quantity) {
    try {
        const cart = getCart();
        const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
        const product = products.find(p => p.id === parseInt(productId));

        if (!product) {
            showAlert('Product not found', 'danger');
            return;
        }

        if (quantity > product.stock) {
            showAlert('Cannot add more items than available in stock', 'danger');
            return;
        }

        if (quantity <= 0) {
            delete cart[productId];
            showAlert('Product removed from cart', 'success');
        } else {
            cart[productId] = quantity;
            showAlert('Cart updated successfully', 'success');
        }
        saveCart(cart);
    } catch (error) {
        console.error('Error updating cart:', error);
        showAlert('Failed to update cart', 'danger');
    }
}

function updateCartDisplay() {
    const cart = getCart();
    const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    const cartItems = document.getElementById('cartItems');
    let total = 0;

    if (!cartItems) return;

    // Filter out null or undefined products
    const validCartItems = Object.entries(cart).filter(([productId, quantity]) => {
        const product = products.find(p => p.id === parseInt(productId));
        return product !== null && product !== undefined;
    });

    if (validCartItems.length === 0) {
        cartItems.innerHTML = '<div class="alert alert-info">Your cart is empty</div>';
        document.getElementById('cartTotal').textContent = '0.00';
        return;
    }

    cartItems.innerHTML = validCartItems.map(([productId, quantity]) => {
        const product = products.find(p => p.id === parseInt(productId));
        const itemTotal = product.price * quantity;
        total += itemTotal;

        return `
            <div class="cart-item mb-3" id="cart-item-${product.id}">
                <div class="d-flex align-items-center">
                    <img src="${product.image}" alt="${product.name}" width="50" class="me-2">
                    <div class="flex-grow-1">
                        <h6 class="mb-0">${product.name}</h6>
                        <div class="d-flex align-items-center mt-2">
                            <button class="btn btn-sm btn-outline-primary" onclick="updateCartQuantity(${product.id}, ${quantity - 1})">
                                <i class="bi bi-dash"></i>
                            </button>
                            <span class="mx-2">${quantity}</span>
                            <button class="btn btn-sm btn-outline-primary" onclick="updateCartQuantity(${product.id}, ${quantity + 1})">
                                <i class="bi bi-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="text-end ms-2">
                        <div>$${itemTotal.toFixed(2)}</div>
                        <button class="btn btn-sm btn-danger mt-2" onclick="removeFromCart(${product.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('cartTotal').textContent = total.toFixed(2);
}

function updateCartCount() {
    const cart = getCart();
    const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
}

// Wishlist Management
function getWishlist() {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
}

function saveWishlist(wishlist) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    updateWishlistCount();
    updateWishlistDisplay();
}

function isInWishlist(productId) {
    return getWishlist().includes(productId);
}

function toggleWishlist(productId) {
    const wishlist = getWishlist();
    const index = wishlist.indexOf(productId);
    
    if (index === -1) {
        wishlist.push(productId);
    } else {
        wishlist.splice(index, 1);
    }
    
    saveWishlist(wishlist);
    loadProducts(); // Refresh product display to update wishlist icons
}

function updateWishlistDisplay() {
    const wishlist = getWishlist();
    const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY));
    const wishlistItems = document.getElementById('wishlistItems');

    wishlistItems.innerHTML = wishlist.map(productId => {
        const product = products.find(p => p.id === productId);
        if (!product) return '';

        return `
            <div class="wishlist-item">
                <div class="d-flex align-items-center">
                    <img src="${product.image}" alt="${product.name}" width="50" class="me-2">
                    <div class="flex-grow-1">
                        <h6 class="mb-0">${product.name}</h6>
                        <div class="text-muted">$${product.price.toFixed(2)}</div>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-primary me-1" onclick="addToCart(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>
                            <i class="bi bi-cart-plus"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="toggleWishlist(${product.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateWishlistCount() {
    const wishlist = getWishlist();
    document.querySelectorAll('.wishlist-count').forEach(el => el.textContent = wishlist.length);
}

// Order Management
// Remove or comment out this line
// const ORDERS_KEY = 'eshop_orders';

function placeOrder() {
    try {
        const cart = getCart();
        if (Object.keys(cart).length === 0) {
            showAlert('Your cart is empty', 'warning');
            return;
        }

        const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
        const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');

        // Validate all products exist and are in stock
        const invalidItems = [];
        Object.entries(cart).forEach(([productId, quantity]) => {
            const product = products.find(p => p.id === parseInt(productId));
            if (!product) {
                invalidItems.push(`Product ID ${productId} not found`);
            } else if (quantity > product.stock) {
                invalidItems.push(`${product.name} has insufficient stock`);
            }
        });

        if (invalidItems.length > 0) {
            showAlert('Cannot place order:\n' + invalidItems.join('\n'), 'danger');
            return;
        }

        // Calculate total and create order items
        let total = 0;
        const orderItems = Object.entries(cart).map(([productId, quantity]) => {
            const product = products.find(p => p.id === parseInt(productId));
            total += product.price * quantity;

            // Update product stock
            const productIndex = products.findIndex(p => p.id === parseInt(productId));
            products[productIndex].stock -= quantity;

            return {
                productId: parseInt(productId),
                name: product.name,
                price: product.price,
                quantity: quantity
            };
        });

        // Create new order
        const order = {
            id: Date.now(), // Use timestamp as ID
            customerId: currentUser.id,
            customerEmail: currentUser.email,
            items: orderItems,
            total: total,
            status: 'pending',
            date: new Date().toISOString()
        };

        // Update orders, products, and clear cart
        orders.push(order);
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
        localStorage.setItem(CART_KEY, JSON.stringify({}));

        // Update UI
        updateCartCount();
        updateCartDisplay();
        
        // Close cart offcanvas and show success message
        const cartOffcanvas = document.getElementById('cartOffcanvas');
        if (cartOffcanvas) {
            bootstrap.Offcanvas.getInstance(cartOffcanvas).hide();
        }
        showAlert('Order placed successfully!', 'success');
        
        // Refresh orders display if on orders page
        if (window.location.pathname.includes('orders.html')) {
            loadCustomerOrders();
        }
    } catch (error) {
        console.error('Error placing order:', error);
        showAlert('Failed to place order. Please try again.', 'danger');
    }
}

function loadCustomerOrders() {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    let customerOrders = orders.filter(order => order && order.customerId === currentUser.id);
    const ordersAccordion = document.getElementById('ordersAccordion');
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const sortOrder = document.getElementById('sortOrder')?.value || 'newest';

    // Apply status filter
    if (statusFilter) {
        customerOrders = customerOrders.filter(order => order.status === statusFilter);
    }

    if (!customerOrders || customerOrders.length === 0) {
        if (ordersAccordion) {
            ordersAccordion.innerHTML = '<div class="alert alert-info">No orders found.</div>';
        }
        return;
    }

    // Apply sort order
    customerOrders.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortOrder === 'oldest' ? dateA - dateB : dateB - dateA;
    });

    ordersAccordion.innerHTML = customerOrders.map((order, index) => `
        <div class="accordion-item">
            <h2 class="accordion-header">
                <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" type="button" 
                        data-bs-toggle="collapse" data-bs-target="#order${order.id}">
                    <div class="d-flex w-100 justify-content-between align-items-center">
                        <span>Order #${order.id} - ${new Date(order.date).toLocaleDateString()}</span>
                        <span class="badge bg-${order.status === 'pending' ? 'warning' : 
                            order.status === 'confirmed' ? 'success' : 'danger'} ms-2">
                            ${order.status}
                        </span>
                    </div>
                </button>
            </h2>
            <div id="order${order.id}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}">
                <div class="accordion-body">
                    <div class="table-responsive">
                        <table class="table table-bordered">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Price</th>
                                    <th>Quantity</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items.map(item => `
                                    <tr>
                                        <td>${item.name}</td>
                                        <td>$${item.price.toFixed(2)}</td>
                                        <td>${item.quantity}</td>
                                        <td>$${(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                                <tr class="table-primary">
                                    <td colspan="3" class="text-end"><strong>Order Total:</strong></td>
                                    <td><strong>$${order.total.toFixed(2)}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="mt-3 d-flex justify-content-between align-items-center">
                        <small class="text-muted">Order placed on ${new Date(order.date).toLocaleString()}</small>
                        ${order.status === 'pending' ? `
                            <button class="btn btn-danger cancel-order-btn" data-order-id="${order.id}">
                                <i class="bi bi-x-circle"></i> Cancel Order
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Add event listeners for cancel buttons
    document.querySelectorAll('.cancel-order-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const orderId = parseInt(e.currentTarget.dataset.orderId);
            cancelOrder(orderId);
        });
    });
}

function cancelOrder(orderId) {
    try {
        const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            showAlert('Order not found', 'danger');
            return;
        }

        // Only allow canceling pending orders
        if (orders[orderIndex].status !== 'pending') {
            showAlert('Only pending orders can be cancelled', 'danger');
            return;
        }

        // Restore product stock
        const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
        orders[orderIndex].items.forEach(item => {
            const productIndex = products.findIndex(p => p.id === item.productId);
            if (productIndex !== -1) {
                products[productIndex].stock += item.quantity;
            }
        });

        // Update order status
        orders[orderIndex].status = 'cancelled';
        
        // Save changes
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
        
        showAlert('Order cancelled successfully', 'success');
        loadCustomerOrders();
    } catch (error) {
        console.error('Error cancelling order:', error);
        showAlert('Failed to cancel order', 'danger');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeCustomerData();
    loadProducts();
    updateCartCount();
    updateCartDisplay();
    updateWishlistCount();
    updateWishlistDisplay();
});