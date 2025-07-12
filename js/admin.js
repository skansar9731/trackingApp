function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    if (isError) {
        toast.style.backgroundColor = '#f44336';
    }
    document.body.appendChild(toast);
    toast.style.display = 'block';

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

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

// Function to convert ISO date to dd/mm/yyyy format
function convertToDDMMYYYY(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.getDate().toString().padStart(2, '0') + '-' + 
           (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
           date.getFullYear();
}

document.addEventListener('DOMContentLoaded', function () {
     console.log("DOM fully loaded");
    updateStatistics();
    // Check authentication
    toggleEditModeButtons(false);
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'index.html';
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

    // Search functionality
document.getElementById('searchInput').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const customerId = document.getElementById('customerSelect').value;
    
    if (!customerId) {
        showToast('Please select a customer first', true);
        return;
    }

    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const customerOrders = orders.filter(order => order.customerId === customerId);
    
    const filteredOrders = customerOrders.filter(order => {
        // Search in all relevant fields for the selected customer only
        const searchFields = [
            order.poNumber,
            order.projectNo,
            order.description,
            order.moc,
            order.status,
            order.contactPerson,
            formatDate(order.date),
            formatDate(order.estimatedDate),
            order.quantity.toString()
        ].join(' ').toLowerCase();
        
        return searchFields.includes(searchTerm);
    });

    // Update table with filtered results
    const tbody = document.getElementById('ordersBody');
    tbody.innerHTML = '';
    filteredOrders.forEach(order => {
        tbody.appendChild(createOrderRow(order));
    });
});

    // Date range filtering
    document.getElementById('startDate').addEventListener('change', filterOrders);
    document.getElementById('endDate').addEventListener('change', filterOrders);

    // Export functionality
    document.getElementById('exportBtn').addEventListener('click', exportToExcel);

    function filterOrders(searchTerm = '') {
    const customerId = document.getElementById('customerSelect').value;
    if (!customerId) return;
    
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    // First filter by selected customer
    let filteredOrders = orders.filter(order => order.customerId === customerId);
    
    // Then apply date filter if dates are selected
    if (startDate || endDate) {
        filteredOrders = filteredOrders.filter(order => {
            const orderDate = new Date(order.date);
            const start = startDate ? new Date(startDate) : new Date(0);
            const end = endDate ? new Date(endDate) : new Date();
            return orderDate >= start && orderDate <= end;
        });
    }
    
    // Then apply search term filter
    if (searchTerm) {
        filteredOrders = filteredOrders.filter(order => {
            const searchFields = [
                order.poNumber,
                order.projectNo,
                order.description,
                order.moc,
                order.status,
                order.contactPerson,
                formatDate(order.date),
                formatDate(order.estimatedDate),
                order.quantity.toString()
            ].join(' ').toLowerCase();
            
            return searchFields.includes(searchTerm);
        });
    }
    
    // Update table display
    updateOrdersDisplay(filteredOrders);
}

    function exportToExcel() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        // Get filtered orders for date range
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const filteredOrders = orders.filter(order => {
            const orderDate = new Date(order.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return orderDate >= start && orderDate <= end;
        });

        // Create CSV content
        const headers = ['Date', 'PO Number', 'Project No', 'Description', 'MOC', 'QTY', 'Status', 'Contact Person', 'Estimated Date'];
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
                order.contactPerson,
                formatDate(order.estimatedDate)
            ].join(','))
        ].join('\n');

        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `orders_${startDate}_${endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    // Initialize data
    if (!localStorage.getItem('customers')) {
        localStorage.setItem('customers', JSON.stringify([]));
    }
    if (!localStorage.getItem('orders')) {
        localStorage.setItem('orders', JSON.stringify([]));
    }

    // Pagination settings
    const ITEMS_PER_PAGE = 10;
    let currentPage = 1;
    let totalPages = 1;

    // Load customers dropdown
    loadCustomers();

    // Initialize pagination
    function initializePagination(orders) {
        const totalItems = orders.length;
        totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        document.getElementById('currentPage').textContent = currentPage;
        document.getElementById('totalPages').textContent = totalPages;
        
        // Update button states
        document.getElementById('prevPage').disabled = currentPage === 1;
        document.getElementById('nextPage').disabled = currentPage === totalPages;
    }

    // Update orders display with pagination
    function updateOrdersDisplay(orders) {
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

    // Update filterOrders function to use pagination
    function filterOrders(searchTerm = '', startDate = '', endDate = '') {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        let filteredOrders = orders;
        
        // Apply filters
        if (searchTerm) {
            filteredOrders = filteredOrders.filter(order => {
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
        }
        
        if (startDate || endDate) {
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.date);
                const start = startDate ? new Date(startDate) : new Date(0);
                const end = endDate ? new Date(endDate) : new Date();
                return orderDate >= start && orderDate <= end;
            });
        }
        
        // Update display with pagination
        updateOrdersDisplay(filteredOrders);
    }

    // Toggle edit mode buttons
    function toggleEditModeButtons(editing) {
        const createBtn = document.getElementById('createCustomerBtn');
        const updateBtn = document.getElementById('updateCustomerBtn');
        const cancelBtn = document.getElementById('cancelEditBtn');
        const deleteBtn = document.getElementById('deleteCustomerBtn');

        if (editing) {
            createBtn.style.display = 'none';
            updateBtn.style.display = 'inline-block';
            cancelBtn.style.display = 'inline-block';
            deleteBtn.style.display = 'inline-block';
        } else {
            createBtn.style.display = 'inline-block';
            updateBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
        }
    }

    function cancelEditMode() {
        toggleEditModeButtons(false);
    }

    document.getElementById('updateCustomerBtn').addEventListener('click', function () {
        document.getElementById('customerForm').dispatchEvent(new Event('submit'));
    });

    // Edit customer button
    document.getElementById('editCustomerBtn').addEventListener('click', function() {
    const customerId = document.getElementById('customerSelect').value;
    
    if (!customerId) {
        showToast('Please select a customer first', true);
        return;
    }

    const customers = JSON.parse(localStorage.getItem('customers')) || [];
    const customer = customers.find(c => c.id === customerId);

    if (customer) {
        // Fill all fields
        document.getElementById('custName').value = customer.name || '';
        document.getElementById('mobile').value = customer.mobile || '';
        document.getElementById('projectNo').value = customer.projectNo || '';
        document.getElementById('designer').value = customer.designer || '';
        document.getElementById('poNumber').value = customer.poNumber || '';
        document.getElementById('orderDate').value = customer.orderDate || '';
        
        // Highlight and fill username/password
        const usernameField = document.getElementById('username');
        const passwordField = document.getElementById('password');
        
        usernameField.value = customer.username || '';
        passwordField.value = customer.password || '';
        
        // Add highlight classes
        usernameField.classList.add('highlight-field');
        passwordField.classList.add('highlight-field');
        
        // Focus on username field
        usernameField.focus();

        // Update selected customer display with username
        document.getElementById('selectedCustomerName').innerHTML = `
            ${customer.name} (${customer.mobile}) - 
            <span class="highlight-username">${customer.username}</span>
        `;

        toggleEditModeButtons(true);
        sessionStorage.setItem('editingCustomerId', customerId);
        showToast('Editing customer credentials - fields highlighted');

         // Scroll to the form
        document.getElementById('customerForm').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
});

    // Customer form submission (Create/Update)
   // Modify the form submission in admin.js
document.getElementById('customerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const isEditMode = sessionStorage.getItem('editingCustomerId') !== null;
    const editingCustomerId = sessionStorage.getItem('editingCustomerId');
    
    // Get form values
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const name = document.getElementById('custName').value.trim();
    
    // Validate required fields
    if (!username || !password || !mobile || !name) {
        showToast('All fields are required', true);
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const customers = JSON.parse(localStorage.getItem('customers')) || [];
    
    if (isEditMode) {
        // EDIT MODE - Update existing customer
        const customerIndex = customers.findIndex(c => c.id === editingCustomerId);
        const userIndex = users.findIndex(u => u.id === editingCustomerId);
        
        if (customerIndex === -1 || userIndex === -1) {
            showToast('Customer not found', true);
            return;
        }
        
        // Check if username is being changed to one that already exists (excluding current customer)
        if (username !== customers[customerIndex].username) {
            if (users.some(u => u.username === username && u.id !== editingCustomerId) || 
                customers.some(c => c.username === username && c.id !== editingCustomerId)) {
                showToast('Username already exists', true);
                return;
            }
        }
        
        // Update customer in customers array
        customers[customerIndex] = {
            ...customers[customerIndex],
            name,
            mobile,
            username,
            password, // Note: In production, you should hash this password
            projectNo: document.getElementById('projectNo').value.trim(),
            designer: document.getElementById('designer').value.trim(),
            poNumber: document.getElementById('poNumber').value.trim(),
            orderDate: document.getElementById('orderDate').value.trim()
        };
        
        // Update user in users array
        users[userIndex] = {
            ...users[userIndex],
            username,
            password,
            name,
            mobile
        };
        
        localStorage.setItem('customers', JSON.stringify(customers));
        localStorage.setItem('users', JSON.stringify(users));
        
        showToast('Customer updated successfully!');
        
        // Clear the form and exit edit mode
        this.reset();
        document.getElementById('selectedCustomerName').textContent = 'None';
        sessionStorage.removeItem('editingCustomerId');
        toggleEditModeButtons(false);
        loadCustomers();
        
        // Remove highlight classes from username/password fields
        document.getElementById('username').classList.remove('highlight-field');
        document.getElementById('password').classList.remove('highlight-field');
    } else {
        // CREATE MODE - Create new customer
        // Check if username exists in both users and customers
        if (users.some(u => u.username === username) || 
            customers.some(c => c.username === username)) {
            showToast('Username already exists', true);
            return;
        }
        
        // Create customer object for customers array
        const newCustomer = {
            id: Date.now().toString(),
            name,
            mobile,
            username,
            password, // Note: In production, hash this password
            projectNo: document.getElementById('projectNo').value.trim(),
            designer: document.getElementById('designer').value.trim(),
            poNumber: document.getElementById('poNumber').value.trim(),
            orderDate: document.getElementById('orderDate').value.trim()
        };
        
        // Create user object for users array
        const newUser = {
            id: newCustomer.id,
            username,
            password,
            role: 'customer',
            name,
            mobile
        };
        
        // Save to both collections
        customers.push(newCustomer);
        users.push(newUser);
        
        localStorage.setItem('customers', JSON.stringify(customers));
        localStorage.setItem('users', JSON.stringify(users));
        
        // Send SMS notification (simulated)
        sendLoginDetails(mobile, username, password);
        
        showToast('Customer created successfully! SMS sent with login details');
        this.reset();
    }
});

// Add password toggle functionality
document.addEventListener('click', function(e) {
  if (e.target.closest('.toggle-password')) {
    const passwordField = document.getElementById('password');
    const icon = e.target.closest('.toggle-password').querySelector('i');
    
    if (passwordField.type === 'password') {
      passwordField.type = 'text';
      icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
      passwordField.type = 'password';
      icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
  }
});

// Simulate SMS sending
function sendLoginDetails(mobile, username, password) {
    // In a real app, integrate with SMS gateway API
    console.log(`SMS to ${mobile}: Your login - Username: ${username}, Password: ${password}, Login at: ${window.location.origin}/index.html`);
    
    // Store notification
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    notifications.push({
        type: 'customer_created',
        mobile,
        username,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

    // Cancel edit
    document.getElementById('cancelEditBtn').addEventListener('click', function () {
        sessionStorage.removeItem('editingCustomerId');
        document.getElementById('customerForm').reset();
        toggleEditModeButtons(false);
        showToast('Edit cancelled');
    });

    // Delete customer
    document.getElementById('deleteCustomerBtn').addEventListener('click', function () {
        const customerId = sessionStorage.getItem('editingCustomerId');
        if (!customerId) {
            showToast('No customer selected for deletion', true);
            return;
        }

        if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            const customers = JSON.parse(localStorage.getItem('customers')) || [];
            const orders = JSON.parse(localStorage.getItem('orders')) || [];

            // Remove customer's orders first
            const updatedOrders = orders.filter(order => order.customerId !== customerId);
            localStorage.setItem('orders', JSON.stringify(updatedOrders));

            // Remove customer
            const updatedCustomers = customers.filter(c => c.id !== customerId);
            localStorage.setItem('customers', JSON.stringify(updatedCustomers));

            // Exit edit mode
            sessionStorage.removeItem('editingCustomerId');
            document.getElementById('customerForm').reset();
            toggleEditModeButtons(false);
            loadCustomers();
            showToast('Customer and their orders deleted successfully!');
        }
    });
    // Initialize responsive behaviors
function initResponsive() {
    // Make select2 responsive
    $('#customerSelect').select2({
        width: '100%',
        dropdownAutoWidth: true
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        // Adjust table layout if needed
        const table = document.getElementById('ordersTable');
        if (window.innerWidth < 480) {
            table.classList.add('mobile-view');
        } else {
            table.classList.remove('mobile-view');
        }
    });
    
    // Initial check
    if (window.innerWidth < 480) {
        document.getElementById('ordersTable').classList.add('mobile-view');
    }
}

// Call this at the end of your DOMContentLoaded event
initResponsive();
});

// Add new order button
document.getElementById('addOrderBtn').addEventListener('click', function () {
    const customerId = document.getElementById('customerSelect').value;
    if (!customerId) {
        alert('Please select a customer first');
        return;
    }

    addNewOrderRow(customerId);
});

// Customer select change
document.getElementById('customerSelect').addEventListener('change', function () {
    const customerId = this.value;
    const customers = JSON.parse(localStorage.getItem('customers')) || [];
    const selectedCustomer = customers.find(c => c.id === customerId);

    if (customerId) {
        // Display selected customer name
        const selectedCustomerDisplay = document.getElementById('selectedCustomerName');
        selectedCustomerDisplay.textContent = selectedCustomer ? selectedCustomer.name : 'None';
        loadCustomerOrders(customerId);
        updateStatistics();
    } else {
        // Reset selected customer display
        document.getElementById('selectedCustomerName').textContent = 'name';
        document.getElementById('ordersBody').innerHTML = '';
        updateStatistics();
    }
});

// Order operations functions
function loadCustomers() {
    const customers = JSON.parse(localStorage.getItem('customers')) || [];
    const select = document.getElementById('customerSelect');
    const selectedCustomerId = sessionStorage.getItem('editingCustomerId') || select.value;

    select.innerHTML = '<option value="">Select a customer</option>';
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = `${customer.name} (${customer.mobile})`;
        if (customer.id === selectedCustomerId) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    document.getElementById('selectedCustomerName').textContent = selectedCustomer?.name || 'None';
}

function loadCustomerOrders(customerId) {
      console.log("Finished loading orders");
    updateStatistics();
    console.log('Loading orders for customer:', customerId);
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const customerOrders = orders.filter(order => order.customerId === customerId);
    const tbody = document.getElementById('ordersBody');

    tbody.innerHTML = '';
    customerOrders.forEach(order => {
          const row = createOrderRow(order);
        tbody.appendChild(createOrderRow(order));
    });
    debugTable();
}

function addNewOrderRow(customerId) {
    const tbody = document.getElementById('ordersBody');
    const newOrder = {
        id: 'new-' + Date.now(),
        customerId,
        poNumber: '',
        projectNo: '',
        description: '',
        moc: '',
        quantity: '',
        status: 'Order Booked',
        date: convertToDDMMYYYY(new Date().toISOString()),
        contactPerson: '',
        estimatedDate: convertToDDMMYYYY(new Date().toISOString()),
        isNew: true
    };

    tbody.appendChild(createOrderRow(newOrder));
    tbody.lastChild.scrollIntoView({ behavior: 'smooth' });
}

function createOrderRow(order) {
    const tr = document.createElement('tr');
    tr.dataset.id = order.id;
    tr.dataset.customerId = order.customerId;
    if (order.isNew) tr.classList.add('edit-mode');

    // Array of all columns in order they should appear
    const columns = [
        { label: 'Date', type: 'date', value: order.date },
        { label: 'PO Number', type: 'text', value: order.poNumber, placeholder: 'PO Number' },
        { label: 'Project No', type: 'text', value: order.projectNo, placeholder: 'Project No' },
        { label: 'Description', type: 'text', value: order.description, placeholder: 'Description' },
        { label: 'MOC', type: 'text', value: order.moc, placeholder: 'MOC' },
        { label: 'QTY', type: 'number', value: order.quantity, placeholder: 'QTY' },
        { 
            label: 'Status', 
            type: 'select', 
            value: order.status || 'Order Booked',
            options: [
                'Order Booked',
                'Design',
                'Assembly',
                'Production',
                'Quality Check',
                'Ready for dispatch',
                'Dispatched',
                'Delivered'
            ]
        },
        { label: 'Contact Person', type: 'text', value: order.contactPerson, placeholder: 'Contact Person' },
        { label: 'Estimated Date', type: 'date', value: order.estimatedDate }
    ];

    // Create cells for each column
    columns.forEach(col => {
        const td = document.createElement('td');
        td.className = 'editable-cell';
        td.setAttribute('data-label', col.label);
        
        // Read-only display
        const readOnlySpan = document.createElement('span');
        readOnlySpan.className = 'read-only';
        
        if (col.label === 'Status') {
            // Special handling for status column
            const statusSpan = document.createElement('span');
            statusSpan.className = getStatusClass(col.value);
            statusSpan.textContent = col.value;
            readOnlySpan.appendChild(statusSpan);
        } else {
            readOnlySpan.textContent = col.type === 'date' ? formatDate(col.value) : (col.value || '-');
        }
        
        // Editable field
        let editableField;
        if (col.type === 'select') {
            editableField = document.createElement('select');
            editableField.className = 'editable-field';
            col.options.forEach(option => {
                const optElement = document.createElement('option');
                optElement.value = option;
                optElement.textContent = option;
                if (option === col.value) optElement.selected = true;
                editableField.appendChild(optElement);
            });
        } else {
            editableField = document.createElement('input');
            editableField.type = col.type;
            editableField.className = 'editable-field';
            editableField.value = col.value || '';
            if (col.placeholder) editableField.placeholder = col.placeholder;
        }
        
        td.appendChild(readOnlySpan);
        td.appendChild(editableField);
        tr.appendChild(td);
    });

    // Actions cell
    const tdActions = document.createElement('td');
    tdActions.className = 'action-buttons';
    tdActions.setAttribute('data-label', 'Actions');

    if (order.isNew) {
        tdActions.innerHTML = `
            <button class="create-btn" onclick="createOrder('${order.id}')" title="Create">
                <i class="fas fa-check"></i>
            </button>
            <button class="cancel-btn" onclick="cancelOrder('${order.id}')" title="Cancel">
                <i class="fas fa-times"></i>
            </button>
        `;
    } else {
        tdActions.innerHTML = `
            <button class="edit-btn" onclick="enableEditMode('${order.id}')" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-btn" onclick="deleteOrder('${order.id}')" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        `;
    }

    tr.appendChild(tdActions);
    return tr;
}

// Add these functions to handle order operations
function createOrder(orderId) {
     console.log("Order created");
    updateStatistics();
    const row = document.querySelector(`tr[data-id="${orderId}"]`);
    const customerId = row.dataset.customerId;
    const orders = JSON.parse(localStorage.getItem('orders')) || [];

    const getValue = (label) => {
        const input = row.querySelector(`[data-label="${label}"] input, [data-label="${label}"] select`);
        return input ? input.value.trim() : '';
    };

    // Get all required values
    const poNumber = getValue('PO Number');
    const description = getValue('Description');
    const quantity = getValue('QTY');

    // Validate required fields
    if (!poNumber || !description || !quantity) {
        showToast('Please fill in all required fields (PO Number, Description, and QTY)', true);
        return; // Exit if validation fails
    }

    const order = {
        id: Date.now().toString(),
        customerId,
        poNumber,
        projectNo: getValue('Project No'),
        description,
        moc: getValue('MOC'),
        quantity,
        status: getValue('Status'),
        date: getValue('Date'),
        contactPerson: getValue('Contact Person'),
        estimatedDate: getValue('Estimated Date'),
        createdAt: new Date().toISOString()
    };

    // Remove temp order if exists
    const existingIndex = orders.findIndex(o => o.id === orderId);
    if (existingIndex !== -1) {
        orders.splice(existingIndex, 1);
    }

    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    loadCustomerOrders(customerId);
    updateStatistics(); 
    showToast('Order created successfully!');
}


function updateOrder(orderId) {
    console.log("Order updated");
    updateStatistics();
    const row = document.querySelector(`tr[data-id="${orderId}"]`);
    const customerId = row.dataset.customerId;
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const index = orders.findIndex(order => order.id === orderId);

    if (index !== -1) {
        const getValue = (label) => {
            const input = row.querySelector(`[data-label="${label}"] input, [data-label="${label}"] select`);
            return input ? input.value : '';
        };

        orders[index] = {
            ...orders[index],
            poNumber: getValue('PO Number'),
            projectNo: getValue('Project No'),
            description: getValue('Description'),
            moc: getValue('MOC'),
            quantity: getValue('QTY'),
            status: getValue('Status'),
            date: getValue('Date'),
            contactPerson: getValue('Contact Person'),
            estimatedDate: getValue('Estimated Date'),
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem('orders', JSON.stringify(orders));
          updateStatistics(); // Add this line
        loadCustomerOrders(customerId);
        showToast('Order updated successfully!');
    }
}
function deleteOrder(orderId) {
    console.log("Order deleted");
    updateStatistics();
    if (confirm('Are you sure you want to delete this order?')) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const customerId = document.getElementById('customerSelect').value;
        const updatedOrders = orders.filter(order => order.id !== orderId);
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        loadCustomerOrders(customerId);
        updateStatistics();
        showToast('Order deleted successfully!');
    }
}

function cancelOrder(orderId) {
    const row = document.querySelector(`tr[data-id="${orderId}"]`);
    if (row) {
        row.remove();
        showToast('New order canceled');
    }
}

function enableEditMode(orderId) {
    const row = document.querySelector(`tr[data-id="${orderId}"]`);
    if (!row) return;
    
    row.classList.add('edit-mode');
    
    // Update action buttons
    const actionsCell = row.querySelector('.action-buttons');
    if (actionsCell) {
        actionsCell.innerHTML = `
            <button class="update-btn" onclick="updateOrder('${orderId}')" title="Update">
                <i class="fas fa-save"></i>
            </button>
            <button class="cancel-btn" onclick="cancelEditMode('${orderId}')" title="Cancel">
                <i class="fas fa-times"></i>
            </button>
        `;
    }
}

function cancelEditMode(orderId) {
    const row = document.querySelector(`tr[data-id="${orderId}"]`);
    if (!row) return;
    
    // Restore original values from data
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
        const fieldsToRestore = [
            { label: 'Date', prop: 'date' },
            { label: 'PO Number', prop: 'poNumber' },
            { label: 'Project No', prop: 'projectNo' },
            { label: 'Description', prop: 'description' },
            { label: 'MOC', prop: 'moc' },
            { label: 'QTY', prop: 'quantity' },
            { label: 'Status', prop: 'status' },
            { label: 'Contact Person', prop: 'contactPerson' },
            { label: 'Estimated Date', prop: 'estimatedDate' }
        ];

        fieldsToRestore.forEach(field => {
            const cell = row.querySelector(`[data-label="${field.label}"]`);
            if (cell) {
                const readOnlySpan = cell.querySelector('.read-only');
                const editableField = cell.querySelector('.editable-field');
                
                if (readOnlySpan) {
                    readOnlySpan.textContent = order[field.prop] || '-';
                }
                
                if (editableField) {
                    if (editableField.tagName === 'SELECT') {
                        editableField.value = order[field.prop] || 'Order Booked';
                    } else {
                        editableField.value = order[field.prop] || '';
                    }
                }
            }
        });
    }
    
    row.classList.remove('edit-mode');
    
    // Restore action buttons
    const actionsCell = row.querySelector('.action-buttons');
    if (actionsCell) {
        actionsCell.innerHTML = `
            <button class="edit-btn" onclick="enableEditMode('${orderId}')" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-btn" onclick="deleteOrder('${orderId}')" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        `;
    }
}

function updateOrder(orderId) {
    const row = document.querySelector(`tr[data-id="${orderId}"]`);
    if (!row) return;
    
    const customerId = row.dataset.customerId;
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const index = orders.findIndex(order => order.id === orderId);

    if (index !== -1) {
        const getValue = (label) => {
            const input = row.querySelector(`[data-label="${label}"] .editable-field`);
            return input ? input.value.trim() : '';
        };

        const updatedOrder = {
            ...orders[index],
            poNumber: getValue('PO Number'),
            projectNo: getValue('Project No'),
            description: getValue('Description'),
            moc: getValue('MOC'),
            quantity: getValue('QTY'),
            status: getValue('Status'),
            date: getValue('Date'),
            contactPerson: getValue('Contact Person'),
            estimatedDate: getValue('Estimated Date'),
            updatedAt: new Date().toISOString()
        };

        // Update read-only display
        const fieldsToUpdate = [
            { label: 'Date', prop: 'date' },
            { label: 'PO Number', prop: 'poNumber' },
            { label: 'Project No', prop: 'projectNo' },
            { label: 'Description', prop: 'description' },
            { label: 'MOC', prop: 'moc' },
            { label: 'QTY', prop: 'quantity' },
            { label: 'Status', prop: 'status' },
            { label: 'Contact Person', prop: 'contactPerson' },
            { label: 'Estimated Date', prop: 'estimatedDate' }
        ];

        fieldsToUpdate.forEach(field => {
            const cell = row.querySelector(`[data-label="${field.label}"]`);
            if (cell) {
                const readOnlySpan = cell.querySelector('.read-only');
                if (readOnlySpan) {
                    readOnlySpan.textContent = updatedOrder[field.prop] || '-';
                }
            }
        });

        orders[index] = updatedOrder;
        localStorage.setItem('orders', JSON.stringify(orders));
        
        row.classList.remove('edit-mode');
        loadCustomerOrders(customerId);
        showToast('Order updated successfully!');
    }
}



function cancelEditMode(orderId) {
    const row = document.querySelector(`tr[data-id="${orderId}"]`);
    if (!row) return;
    
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id === orderId);
    
    if (order || row.dataset.isNew === 'true') {
        // Restore all field values
        const fieldsToRestore = [
            { label: 'Date', prop: 'date' },
            { label: 'PO Number', prop: 'poNumber' },
            { label: 'Project No', prop: 'projectNo' },
            { label: 'Description', prop: 'description' },
            { label: 'MOC', prop: 'moc' },
            { label: 'QTY', prop: 'quantity' },
            { label: 'Status', prop: 'status' },
            { label: 'Contact Person', prop: 'contactPerson' },
            { label: 'Estimated Date', prop: 'estimatedDate' }
        ];

        fieldsToRestore.forEach(field => {
            const cell = row.querySelector(`[data-label="${field.label}"]`);
            if (cell) {
                const readOnlySpan = cell.querySelector('.read-only');
                const editableField = cell.querySelector('.editable-field');
                
                if (readOnlySpan) {
                    // Update the read-only display
                    const value = order ? order[field.prop] : (field.prop === 'status' ? 'Order Booked' : '');
                    readOnlySpan.textContent = value || '-';
                }
                
                if (editableField) {
                    // Update the editable field (though it should be hidden)
                    if (editableField.tagName === 'SELECT') {
                        editableField.value = order ? order[field.prop] : 'Order Booked';
                    } else {
                        editableField.value = order ? order[field.prop] : '';
                    }
                }
            }
        });

        // Remove edit mode class to hide inputs and show read-only text
        row.classList.remove('edit-mode');
        
        // For new orders that were cancelled, remove the row completely
        if (row.dataset.isNew === 'true') {
            row.remove();
            showToast('New order cancelled');
            return;
        }

        // Restore action buttons for existing orders
        const actionsCell = row.querySelector('.action-buttons');
        if (actionsCell) {
            actionsCell.innerHTML = `
                <button class="edit-btn" onclick="enableEditMode('${orderId}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteOrder('${orderId}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        }
    }
}

// Debug function to check table structure
function debugTable() {
    const tbody = document.getElementById('ordersBody');
    console.log('Table body children:', tbody.children.length);
    if (tbody.children.length > 0) {
        console.log('First row cells:', tbody.children[0].children);
    }
}

// Call this after adding rows
debugTable();

function generateUsername(name, mobile) {
  const cleanName = name.trim().toLowerCase().replace(/\s+/g, '');
  const cleanMobile = mobile.replace(/\D/g, '').slice(-4);
  return `${cleanName}${cleanMobile}`;
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Add this to your DOMContentLoaded event listener
document.getElementById('generateUsername').addEventListener('click', function() {
  const name = document.getElementById('custName').value;
  const mobile = document.getElementById('mobile').value;
  if (name && mobile) {
    const username = generateUsername(name, mobile);
    document.getElementById('username').value = username;
    document.getElementById('displayUsername').textContent = username;
    document.getElementById('credentialsDisplay').style.display = 'block';
  } else {
    showToast('Please enter customer name and mobile first', true);
  }
});

document.getElementById('generatePassword').addEventListener('click', function() {
  const password = generatePassword();
  document.getElementById('password').value = password;
  document.getElementById('displayPassword').textContent = password;
  document.getElementById('credentialsDisplay').style.display = 'block';
});

// Password toggle functionality
document.querySelector('.toggle-password').addEventListener('click', function(e) {
  const passwordField = document.getElementById('password');
  const icon = this.querySelector('i');
  if (passwordField.type === 'password') {
    passwordField.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    passwordField.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
});

// Auto-generate credentials when name/mobile are filled
document.getElementById('custName').addEventListener('blur', autoGenerateCredentials);
document.getElementById('mobile').addEventListener('blur', autoGenerateCredentials);

function autoGenerateCredentials() {
  const name = document.getElementById('custName').value;
  const mobile = document.getElementById('mobile').value;
  if (name && mobile && !document.getElementById('username').value) {
    document.getElementById('username').value = generateUsername(name, mobile);
    document.getElementById('password').value = generatePassword();
    document.getElementById('displayUsername').textContent = document.getElementById('username').value;
    document.getElementById('displayPassword').textContent = document.getElementById('password').value;
    document.getElementById('credentialsDisplay').style.display = 'block';
  }
}

// View customer details functionality

// View Customer Details
document.getElementById('viewCustomerBtn').addEventListener('click', function() {
    const customerId = document.getElementById('customerSelect').value;
    if (!customerId) return;

    const customers = JSON.parse(localStorage.getItem('customers')) || [];
    const customer = customers.find(c => c.id === customerId);

    if (customer) {
        // Format exactly like your screenshot
        const modalContent = `
            <h3>${customer.name || 'N/A'}</h3>
            <p><strong>${customer.mobile || 'N/A'}</strong></p>
            
            <p><strong>${customer.projectNo || 'N/A'}</strong></p>
            <p>${customer.designer || 'N/A'}</p>
            
            <p><strong>${customer.poNumber || 'N/A'}</strong></p>
            <p>${formatDate(customer.orderDate) || 'N/A'}</p>
            
            <p><strong>Username</strong></p>
            <p class="highlight-username">${customer.username || 'N/A'}</p>
            
            <p><strong>Password</strong></p>
            <p class="highlight-password">${customer.password || 'N/A'}</p>
        `;
        
        document.getElementById('customerDetailsModal').innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Customer Details</h2>
                <div class="customer-details-content">
                    ${modalContent}
                </div>
            </div>
        `;
        
        document.getElementById('customerDetailsModal').style.display = 'flex';
    }
});

// Close modal
document.querySelector('.close-modal').addEventListener('click', function() {
  document.getElementById('customerDetailsModal').style.display = 'none';
});

// Close when clicking outside modal
window.addEventListener('click', function(event) {
  if (event.target === document.getElementById('customerDetailsModal')) {
    document.getElementById('customerDetailsModal').style.display = 'none';
  }
});
// Close modal functionality
document.querySelector('.close-modal').addEventListener('click', function() {
    document.getElementById('viewCustomerModal').style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target === document.getElementById('viewCustomerModal')) {
        document.getElementById('viewCustomerModal').style.display = 'none';
    }
});

// Close modal functionality
document.querySelector('.close-modal').addEventListener('click', function() {
    document.getElementById('customerDetailsModal').style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('customerDetailsModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Close modal functionality
document.querySelector('.close-modal').addEventListener('click', function() {
    document.getElementById('customerDetailsModal').style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('customerDetailsModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Preserve your existing edit functionality
document.getElementById('editCustomerBtn').addEventListener('click', function() {
    const customerId = document.getElementById('customerSelect').value;
    if (!customerId) {
        showToast('Please select a customer first', true);
        return;
    }

    const customers = JSON.parse(localStorage.getItem('customers')) || [];
    const customer = customers.find(c => c.id === customerId);

    if (customer) {
        // Fill all fields
        document.getElementById('custName').value = customer.name || '';
        document.getElementById('mobile').value = customer.mobile || '';
        document.getElementById('projectNo').value = customer.projectNo || '';
        document.getElementById('designer').value = customer.designer || '';
        document.getElementById('poNumber').value = customer.poNumber || '';
        document.getElementById('orderDate').value = customer.orderDate || '';
        
        // Highlight and fill username/password
        const usernameField = document.getElementById('username');
        const passwordField = document.getElementById('password');
        
        usernameField.value = customer.username || '';
        passwordField.value = customer.password || '';
        
        // Add highlight classes
        usernameField.classList.add('highlight-field');
        passwordField.classList.add('highlight-field');
        
        // Focus on username field
        usernameField.focus();

        // Update selected customer display with username
        document.getElementById('selectedCustomerName').innerHTML = `
            ${customer.name} (${customer.mobile}) - 
            <span class="highlight-username">${customer.username}</span>
        `;

        toggleEditModeButtons(true);
        sessionStorage.setItem('editingCustomerId', customerId);
        showToast('Editing customer credentials - fields highlighted');
    }
});
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
// Function to update statistics
function loadCustomerOrders(customerId) {
    console.log('Loading orders for customer:', customerId);
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const customerOrders = orders.filter(order => order.customerId === customerId);
    const tbody = document.getElementById('ordersBody');

    tbody.innerHTML = '';
    customerOrders.forEach(order => {
        tbody.appendChild(createOrderRow(order));
    });
    
    // Update statistics whenever orders are loaded
    updateStatistics();
}
// Call this whenever orders are updated
function refreshOrders() {
    const customerId = document.getElementById('customerSelect').value;
    if (customerId) {
        loadCustomerOrders(customerId);
    }
    updateStatistics();
}
function updateStatistics() {
    console.log("Updating statistics..."); // Debug log
    
    try {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const customerId = document.getElementById('customerSelect').value;
        
        console.log("Total orders in storage:", orders.length); // Debug log
        console.log("Selected customer ID:", customerId); // Debug log
        
        // Filter by customer if one is selected
        const customerOrders = customerId 
            ? orders.filter(order => order.customerId === customerId)
            : orders;
        
        console.log("Customer orders count:", customerOrders.length); // Debug log
        
        const activeOrders = customerOrders.filter(order => 
            order.status && order.status !== 'Delivered'
        ).length;
        
        const deliveredOrders = customerOrders.filter(order => 
            order.status && order.status === 'Delivered'
        ).length;
        
        console.log("Active orders:", activeOrders); // Debug log
        console.log("Delivered orders:", deliveredOrders); // Debug log
        
        // Update the DOM elements
        document.getElementById('activeOrders').textContent = activeOrders;
        document.getElementById('totalOrders').textContent = customerOrders.length;
        document.getElementById('deliveredOrders').textContent = deliveredOrders;
        
        console.log("Statistics updated successfully"); // Debug log
    } catch (error) {
        console.error("Error updating statistics:", error);
    }
}