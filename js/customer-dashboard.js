// Function to format date to dd/mm/yyyy format
// Function to format date to dd/mm/yyyy format
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    // Handle different date formats
    let date;
    if (typeof dateString === 'string') {
        // Try to parse ISO format first
        date = new Date(dateString);
        if (isNaN(date.getTime())) {
            // Try to parse as dd/mm/yyyy
            const parts = dateString.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; // Months are 0-based in JS
                const year = parseInt(parts[2], 10);
                date = new Date(year, month, day);
            }
        }
    } else if (dateString instanceof Date) {
        date = dateString;
    }
    
    if (isNaN(date.getTime())) return 'N/A';
    
    // Format as dd-mm-yyyy
    return date.getDate().toString().padStart(2, '0') + '-' + 
           (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
           date.getFullYear();
}

// Function to format status with color
function getStatusClass(status) {
    const statusMap = {
        'Order Booked': 'status-order-booked',
        'Design': 'status-design',
        'Assembly': 'status-assembly',
        'Production': 'status-production',
        'Quality Check': 'status-quality-check',
        'Ready for dispatch': 'status-ready-dispatch',
        'Dispatched': 'status-dispatched',
        'Delivered': 'status-delivered'
    };
    return statusMap[status] || 'status-pending';
}
// Function to refresh orders table and cards
function refreshOrdersTable() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) return;

    // Get orders from localStorage
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    let userOrders = orders.filter(order => order.customerId === currentUser.id);

    // Update statistics
    updateStatistics(userOrders);
 userOrders = filterByDateRange(userOrders);
    // Populate table and cards
    updateStatistics(userOrders);
    populateTable(userOrders);
    populateCards(userOrders);
}

// Function to update statistics
function updateStatistics(orders) {
    const activeOrders = document.getElementById('activeOrders');
    const totalOrders = document.getElementById('totalOrders');
    const deliveredOrders = document.getElementById('deliveredOrders');

    activeOrders.textContent = orders.filter(order => 
        order.status !== 'Delivered' && order.status !== 'Cancelled'
    ).length;
    totalOrders.textContent = orders.length;
    deliveredOrders.textContent = orders.filter(order => 
        order.status === 'Delivered'
    ).length;
}

// Function to populate table
function populateTable(orders) {
    const ordersBody = document.getElementById('ordersBody');
    ordersBody.innerHTML = '';

    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Date">${formatDate(order.date)}</td>
            <td data-label="PO Number">${order.poNumber}</td>
            <td data-label="Project No">${order.projectNo || 'N/A'}</td>
            <td data-label="Description">${order.description || 'N/A'}</td>
            <td data-label="MOC">${order.moc || 'N/A'}</td>
            <td data-label="QTY">${order.quantity || 'N/A'}</td>
            <td data-label="Contact Person">${order.contactPerson || 'N/A'}</td>
            <td data-label="Status" class="status-${order.status.toLowerCase()}">
                ${order.status}
            </td>
        `;
        ordersBody.appendChild(row);
    });
}

// Function to populate cards
function populateCards(orders) {
    const ordersCards = document.getElementById('ordersCards');
    ordersCards.innerHTML = '';

    orders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'order-card';
        card.innerHTML = `
            <h4>Order Details</h4>
            <div class="order-info">
                <label>Date:</label><span>${formatDate(order.date)}</span>
            </div>
            <div class="order-info">
                <label>PO Number:</label><span>${order.poNumber}</span>
            </div>
            <div class="order-info">
                <label>Project No:</label><span>${order.projectNo || 'N/A'}</span>
            </div>
            <div class="order-info">
                <label>Description:</label><span>${order.description || 'N/A'}</span>
            </div>
            <div class="order-info">
                <label>MOC:</label><span>${order.moc || 'N/A'}</span>
            </div>
            <div class="order-info">
                <label>QTY:</label><span>${order.quantity || 'N/A'}</span>
            </div>
            <div class="order-info">
                <label>Contact Person:</label><span>${order.contactPerson || 'N/A'}</span>
            </div>
            <div class="status ${order.status.toLowerCase()}">${order.status}</div>
        `;
        ordersCards.appendChild(card);
    });
}

// Function to create order row for table
function createOrderRow(order) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td data-label="Date">${formatDate(order.date)}</td>
        <td data-label="PO Number">${order.poNumber}</td>
        <td data-label="Project No">${order.projectNo || 'N/A'}</td>
        <td data-label="Description">${order.description || 'N/A'}</td>
        <td data-label="MOC">${order.moc || 'N/A'}</td>
        <td data-label="QTY">${order.quantity || 'N/A'}</td>
        <td data-label="Contact Person">${order.contactPerson || 'N/A'}</td>
        <td data-label="Status" class="status-${order.status.toLowerCase()}">
            ${order.status}
        </td>
    `;
    return row;
}

// Pagination settings
const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let totalPages = 1;

// Function to initialize pagination
function initializePagination(orders) {
    const totalItems = orders.length;
    totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    
    // Update button states
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

// Function to update orders display with pagination
function updateOrdersDisplay(orders) {
    // Update statistics
    document.getElementById('activeOrders').textContent = 
        orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
    document.getElementById('totalOrders').textContent = orders.length;
    document.getElementById('deliveredOrders').textContent = 
        orders.filter(o => o.status === 'delevered' || o.status === 'delivered').length;
    
    // Calculate start and end index
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    // Get current page orders
    const pageOrders = orders.slice(startIndex, endIndex);
    
    // Update table
    const ordersBody = document.getElementById('ordersBody');
    ordersBody.innerHTML = '';
    
    pageOrders.forEach(order => {
        ordersBody.appendChild(createOrderRow(order));
    });

    // Update cards
    const ordersCards = document.getElementById('ordersCards');
    ordersCards.innerHTML = '';

    pageOrders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'order-card';
        card.innerHTML = `
            <h4>Order Details</h4>
            <div class="order-info">
                <label>Date:</label><span>${formatDate(order.date)}</span>
            </div>
            <div class="order-info">
                <label>PO Number:</label><span>${order.poNumber}</span>
            </div>
            <div class="order-info">
                <label>Project No:</label><span>${order.projectNo || 'N/A'}</span>
            </div>
            <div class="order-info">
                <label>Description:</label><span>${order.description || 'N/A'}</span>
            </div>
            <div class="order-info">
                <label>MOC:</label><span>${order.moc || 'N/A'}</span>
            </div>
            <div class="order-info">
                <label>QTY:</label><span>${order.quantity || 'N/A'}</span>
            </div>
            <div class="order-info">
                <label>Contact Person:</label><span>${order.contactPerson || 'N/A'}</span>
            </div>
            <div class="status ${order.status.toLowerCase()}">${order.status}</div>
        `;
        ordersCards.appendChild(card);
    });
    
    // Update pagination
    initializePagination(orders);
}

// Handle page change
document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        filterOrders(searchTerm, startDate, endDate);
    }
});

document.getElementById('nextPage').addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        filterOrders(searchTerm, startDate, endDate);
    }
});

// Search and filter functionality
function filterOrders() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) return;

    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const userOrders = orders.filter(order => order.customerId === currentUser.id);
    
    const filteredOrders = userOrders.filter(order => {
        // Check date range
        const orderDate = new Date(order.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (orderDate < start || orderDate > end) {
            return false;
        }
        
        // Check search term
        const searchFields = [
            order.poNumber,
            order.projectNo,
            order.description,
            order.moc,
            order.contactPerson,
            order.status
        ].join(' ').toLowerCase();
        
        return searchFields.includes(searchTerm);
    });
    
    updateOrdersDisplay(filteredOrders);
}

// Export to Excel
function exportToExcel() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const userOrders = orders.filter(order => order.customerId === currentUser.id);
    
    // Get filtered orders for date range
    const filteredOrders = userOrders.filter(order => {
        const orderDate = new Date(order.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return orderDate >= start && orderDate <= end;
    });

    // Create CSV content
    const headers = ['Date', 'PO Number', 'Project No', 'Description', 'MOC', 'QTY', 'Status', 'Contact Person'];
    const csvContent = [
        headers.join(','),
        ...filteredOrders.map(order => [
            formatDate(order.date),
            order.poNumber,
            order.projectNo,
            order.description,
            order.moc,
            order.quantity,
            order.status,
            order.contactPerson
        ].join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `my_orders_${startDate}_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialize date inputs and event listeners
document.addEventListener('DOMContentLoaded', function() {
     initializeDateInputs();
     updateNotificationCount();
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'customer-login.html';
        return;
    }

    // Initialize date inputs with current date
    const today = new Date();
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    
    document.getElementById('startDate').min = formatDate(yearAgo);
    document.getElementById('startDate').value = formatDate(yearAgo);
    document.getElementById('endDate').max = formatDate(today);
    document.getElementById('endDate').value = formatDate(today);

    // Add event listeners
    document.getElementById('searchInput').addEventListener('input', filterOrders);
    document.getElementById('startDate').addEventListener('change', filterOrders);
    document.getElementById('endDate').addEventListener('change', filterOrders);
    document.getElementById('exportBtn').addEventListener('click', exportToExcel);

    // Initial load
    refreshOrdersTable();
});

// Initialize orders table
refreshOrdersTable();

// Check for updates every 5 seconds
setInterval(refreshOrdersTable, 5000);

//  Initialize date inputs
function initializeDateInputs() {
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    document.getElementById('startDate').valueAsDate = oneYearAgo;
    document.getElementById('endDate').valueAsDate = today;
    
    // Set min/max dates (optional)
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 5); // Allow 5 years back
    document.getElementById('startDate').min = formatDateForInput(minDate);
    document.getElementById('endDate').max = formatDateForInput(today);
}

function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

// Filter orders by date range
function filterByDateRange(orders) {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    
    // Reset time parts to ensure full day coverage
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    return orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= startDate && orderDate <= endDate;
    });
}

// Event listeners for date filtering
document.getElementById('applyDateFilter').addEventListener('click', () => {
    refreshOrdersTable();
});

document.getElementById('resetDateFilter').addEventListener('click', () => {
    initializeDateInputs();
    refreshOrdersTable();
});
// Update notification count on dashboard load
function updateNotificationCount() {
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationBadge');
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}