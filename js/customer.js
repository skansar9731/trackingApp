document.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'customer') {
        window.location.href = 'customer-login.html';
        return;
    }

    // Load customer's orders
    loadCustomerOrders(currentUser.id);

    // Search functionality
    document.getElementById('searchOrder').addEventListener('input', function() {
        filterOrders();
    });

    // Status filter
    document.getElementById('filterStatus').addEventListener('change', function() {
        filterOrders();
    });
});

function loadCustomerOrders(customerId) {
    const orders = JSON.parse(localStorage.getItem('orders'));
    const customerOrders = orders.filter(order => order.customerId === customerId);
    
    renderOrdersTable(customerOrders);
}

function filterOrders() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const customerOrders = orders.filter(order => order.customerId === currentUser.id);
    
    const searchTerm = document.getElementById('searchOrder').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    
    let filteredOrders = customerOrders;
    
    if (searchTerm) {
        filteredOrders = filteredOrders.filter(order => 
            (order.poNumber && order.poNumber.toLowerCase().includes(searchTerm)) ||
            (order.projectNo && order.projectNo.toLowerCase().includes(searchTerm)) ||
            (order.description && order.description.toLowerCase().includes(searchTerm))
        );
    }
    
    if (statusFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
    }
    
    renderOrdersTable(filteredOrders);
}

function renderOrdersTable(orders) {
    const container = document.getElementById('ordersContainer');
    container.innerHTML = '';
    
    if (orders.length === 0) {
        container.innerHTML = '<p class="no-orders">No orders found</p>';
        return;
    }
    
    orders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'order-card';
        
        // Format the date
        const formattedDate = formatDate(order.date) || '-';
        
        card.innerHTML = `
            <div class="order-field">
                <span class="field-label">Date:</span>
                <span class="field-value">${formattedDate}</span>
            </div>
            <div class="order-field">
                <span class="field-label">PO Number:</span>
                <span class="field-value">${order.poNumber || '-'}</span>
            </div>
            <div class="order-field">
                <span class="field-label">Project No:</span>
                <span class="field-value">${order.projectNo || '-'}</span>
            </div>
            <div class="order-field">
                <span class="field-label">Description:</span>
                <span class="field-value">${order.description || '-'}</span>
            </div>
            <div class="order-field">
                <span class="field-label">MOC:</span>
                <span class="field-value">${order.moc || '-'}</span>
            </div>
            <div class="order-field">
                <span class="field-label">QTY:</span>
                <span class="field-value">${order.quantity || '-'}</span>
            </div>
            <div class="order-field">
                <span class="field-label">Status:</span>
                <span class="field-value ${getStatusClass(order.status)}">${order.status || '-'}</span>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function formatDate(dateString) {
    if (!dateString) return null;
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB'); // Formats as dd/mm/yyyy
    } catch {
        return dateString; // Return as-is if not a valid date
    }
}

function getStatusClass(status) {
    if (!status) return '';
    
    status = status.toLowerCase();
    if (status.includes('order booked')) return 'status-order-booked';
    if (status.includes('production')) return 'status-production';
    if (status.includes('quality check')) return 'status-quality-check';
    if (status.includes('dispatch')) return 'status-dispatch';
    if (status.includes('delivered')) return 'status-delivered';
    return '';
}

function getStatusClass(status) {
    if (!status) return '';
    
    status = status.toLowerCase();
    if (status.includes('pending')) return 'status-pending';
    if (status.includes('process')) return 'status-processing';
    if (status.includes('complete')) return 'status-completed';
    if (status.includes('deliver')) return 'status-delivered';
    if (status.includes('cancel')) return 'status-cancelled';
    return '';
}