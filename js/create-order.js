// Utility Functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.getDate().toString().padStart(2, '0') + '-' + 
           (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
           date.getFullYear();
}

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

// Customer Functions
function loadCustomers() {
    const select = document.getElementById('customerSelect');
    if (!select) return;

    select.innerHTML = '<option value="">Select a customer</option>';
    
    try {
        const customers = JSON.parse(localStorage.getItem('customers')) || [];
        
        if (customers.length === 0) {
            // Add sample customers if none exist
            const sampleCustomers = [
                { id: '1', name: 'John Doe', mobile: '1234567890' },
                { id: '2', name: 'Jane Smith', mobile: '0987654321' },
                { id: '3', name: 'Bob Johnson', mobile: '1122334455' }
            ];
            localStorage.setItem('customers', JSON.stringify(sampleCustomers));
            customers.push(...sampleCustomers);
        }

        customers.forEach(customer => {
            const option = new Option(
                `${customer.name} (${customer.mobile})`,
                customer.id
            );
            select.add(option);
        });

        // Initialize Select2 if available
        if (typeof $ !== 'undefined' && $.fn.select2) {
            $(select).select2({
                width: '100%',
                dropdownAutoWidth: true,
                placeholder: 'Select a customer',
                allowClear: true
            });
        }
    } catch (error) {
        console.error("Error loading customers:", error);
        showToast('Error loading customers. Please try refreshing the page.', true);
    }
}

// Order Functions
function loadCustomerOrders(customerId) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const customerOrders = orders.filter(order => order.customerId === customerId);
    const tbody = document.getElementById('ordersBody');

    tbody.innerHTML = '';
    customerOrders.forEach(order => {
        const row = createOrderRow(order);
        tbody.appendChild(row);
    });

    // Update selected customer display
    const customers = JSON.parse(localStorage.getItem('customers')) || [];
    const selectedCustomer = customers.find(c => c.id === customerId);
    document.getElementById('selectedCustomerName').textContent = selectedCustomer ? 
        `${selectedCustomer.name} (${selectedCustomer.mobile})` : 'None';

    updateStatistics();
}

function createOrderRow(order) {
    const tr = document.createElement('tr');
    tr.dataset.id = order.id;
    tr.dataset.customerId = order.customerId;
    if (order.isNew) tr.classList.add('edit-mode');

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

    columns.forEach(col => {
        const td = document.createElement('td');
        td.className = 'editable-cell';
        td.setAttribute('data-label', col.label);
        
        // Read-only display
        const readOnlySpan = document.createElement('span');
        readOnlySpan.className = 'read-only';
        
        if (col.label === 'Status') {
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
            <button class="create-btn" title="Create">
                <i class="fas fa-check"></i>
            </button>
            <button class="cancel-btn" title="Cancel">
                <i class="fas fa-times"></i>
            </button>
        `;
    } else {
        tdActions.innerHTML = `
            <button class="edit-btn" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-btn" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        `;
    }

    tr.appendChild(tdActions);
    return tr;
}

function createOrder(orderId) {
    const row = document.querySelector(`tr[data-id="${orderId}"]`);
    if (!row) return;
    
    const customerId = row.dataset.customerId;
    const orders = JSON.parse(localStorage.getItem('orders')) || [];

    const getValue = (label) => {
        const input = row.querySelector(`[data-label="${label}"] input, [data-label="${label}"] select`);
        return input ? input.value.trim() : '';
    };

    // Validate required fields
    const poNumber = getValue('PO Number');
    const description = getValue('Description');
    const quantity = getValue('QTY');
    
    if (!poNumber || !description || !quantity) {
        showToast('Please fill in all required fields (PO Number, Description, and QTY)', true);
        return;
    }

    const order = {
        id: Date.now().toString(),
        customerId: customerId,
        poNumber: poNumber,
        projectNo: getValue('Project No'),
        description: description,
        moc: getValue('MOC'),
        quantity: quantity,
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
    showToast('Order created successfully!');
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

        orders[index] = updatedOrder;
        localStorage.setItem('orders', JSON.stringify(orders));
        
        row.classList.remove('edit-mode');
        loadCustomerOrders(customerId);
        showToast('Order updated successfully!');
    }
}

function deleteOrder(orderId) {
    if (confirm('Are you sure you want to delete this order?')) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const customerId = document.getElementById('customerSelect').value;
        const updatedOrders = orders.filter(order => order.id !== orderId);
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        
        if (customerId) {
            loadCustomerOrders(customerId);
        }
        
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
    
    const actionsCell = row.querySelector('.action-buttons');
    if (actionsCell) {
        actionsCell.innerHTML = `
            <button class="update-btn" title="Update">
                <i class="fas fa-save"></i>
            </button>
            <button class="cancel-btn" title="Cancel">
                <i class="fas fa-times"></i>
            </button>
        `;
    }
}

function cancelEditMode(orderId) {
    const row = document.querySelector(`tr[data-id="${orderId}"]`);
    if (!row) return;
    
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id === orderId);
    
    if (order || row.dataset.isNew === 'true') {
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
                    const value = order ? order[field.prop] : (field.prop === 'status' ? 'Order Booked' : '');
                    if (field.label === 'Status') {
                        readOnlySpan.innerHTML = `<span class="${getStatusClass(value)}">${value}</span>`;
                    } else {
                        readOnlySpan.textContent = value || '-';
                    }
                }
                
                if (editableField) {
                    if (editableField.tagName === 'SELECT') {
                        editableField.value = order ? order[field.prop] : 'Order Booked';
                    } else {
                        editableField.value = order ? order[field.prop] : '';
                    }
                }
            }
        });

        row.classList.remove('edit-mode');
        
        if (row.dataset.isNew === 'true') {
            row.remove();
            showToast('New order cancelled');
            return;
        }

        const actionsCell = row.querySelector('.action-buttons');
        if (actionsCell) {
            actionsCell.innerHTML = `
                <button class="edit-btn" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        }
    }
}

function updateStatistics() {
    const customerId = document.getElementById('customerSelect').value;
    if (!customerId) {
        document.getElementById('activeOrders').textContent = '0';
        document.getElementById('totalOrders').textContent = '0';
        document.getElementById('deliveredOrders').textContent = '0';
        return;
    }

    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const customerOrders = orders.filter(order => order.customerId === customerId);

    const activeOrders = customerOrders.filter(order => order.status !== 'Delivered').length;
    const totalOrders = customerOrders.length;
    const deliveredOrders = customerOrders.filter(order => order.status === 'Delivered').length;

    document.getElementById('activeOrders').textContent = activeOrders;
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('deliveredOrders').textContent = deliveredOrders;
}

function filterOrders() {
    const customerId = document.getElementById('customerSelect').value;
    if (!customerId) {
        showToast('Please select a customer first', true);
        return;
    }

    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const customerOrders = orders.filter(order => order.customerId === customerId);
    
    const filteredOrders = customerOrders.filter(order => {
        // Date filtering
        if (startDate || endDate) {
            const orderDate = new Date(order.date);
            const start = startDate ? new Date(startDate) : new Date(0);
            const end = endDate ? new Date(endDate) : new Date();
            if (!(orderDate >= start && orderDate <= end)) {
                return false;
            }
        }
        
        // Search term filtering
        if (searchTerm) {
            const searchFields = [
                order.poNumber,
                order.projectNo,
                order.description,
                order.moc,
                order.status,
                order.contactPerson,
                formatDate(order.date),
                formatDate(order.estimatedDate)
            ].join(' ').toLowerCase();
            
            return searchFields.includes(searchTerm);
        }
        
        return true;
    });

    const tbody = document.getElementById('ordersBody');
    tbody.innerHTML = '';
    filteredOrders.forEach(order => {
        tbody.appendChild(createOrderRow(order));
    });
    updateStatistics();
}

function exportToExcel() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const customerId = document.getElementById('customerSelect').value;
    
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    let filteredOrders = orders;
    
    if (customerId) {
        filteredOrders = filteredOrders.filter(order => order.customerId === customerId);
    }
    
    filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return orderDate >= start && orderDate <= end;
    });

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

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    // Initialize data
    if (!localStorage.getItem('orders')) {
        localStorage.setItem('orders', JSON.stringify([]));
    }
    if (!localStorage.getItem('customers')) {
        localStorage.setItem('customers', JSON.stringify([]));
    }

    // Initialize date inputs
    const today = new Date();
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    
    document.getElementById('startDate').min = formatDate(yearAgo);
    document.getElementById('startDate').value = formatDate(yearAgo);
    document.getElementById('endDate').max = formatDate(today);
    document.getElementById('endDate').value = formatDate(today);

    // Initialize Select2 and load customers
    const select = document.getElementById('customerSelect');
    if (select) {
        $(select).select2({
            width: '100%',
            dropdownAutoWidth: true,
            placeholder: 'Select a customer',
            allowClear: true
        });

        loadCustomers();
    }

    // Customer select change
    document.getElementById('customerSelect').addEventListener('change', function() {
        const customerId = this.value;
        if (customerId) {
            loadCustomerOrders(customerId);
        } else {
            document.getElementById('ordersBody').innerHTML = '';
            document.getElementById('selectedCustomerName').textContent = 'None';
            updateStatistics();
        }
    });

    // Add new order button
    document.getElementById('addOrderBtn').addEventListener('click', function() {
        const customerId = document.getElementById('customerSelect').value;
        if (!customerId) {
            showToast('Please select a customer first', true);
            return;
        }

        const newOrder = {
            id: 'new-' + Date.now().toString(),
            customerId: customerId,
            isNew: true,
            date: new Date().toISOString(),
            status: 'Order Booked',
            createdAt: new Date().toISOString()
        };

        const row = createOrderRow(newOrder);
        const tbody = document.getElementById('ordersBody');
        tbody.insertBefore(row, tbody.firstChild);

        enableEditMode(newOrder.id);
    });

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', filterOrders);

    // Date range filtering
    document.getElementById('startDate').addEventListener('change', filterOrders);
    document.getElementById('endDate').addEventListener('change', filterOrders);

    // Export functionality
    document.getElementById('exportBtn').addEventListener('click', exportToExcel);

    // Event delegation for order operations
    document.getElementById('ordersBody').addEventListener('click', function(e) {
        const row = e.target.closest('tr');
        if (!row) return;
        
        const orderId = row.dataset.id;
        const target = e.target.closest('button');
        if (!target) return;
        
        if (target.classList.contains('edit-btn')) {
            enableEditMode(orderId);
        } else if (target.classList.contains('update-btn')) {
            updateOrder(orderId);
        } else if (target.classList.contains('cancel-btn')) {
            if (row.classList.contains('edit-mode') && row.dataset.isNew === 'true') {
                cancelOrder(orderId);
            } else {
                cancelEditMode(orderId);
            }
        } else if (target.classList.contains('delete-btn')) {
            deleteOrder(orderId);
        } else if (target.classList.contains('create-btn')) {
            createOrder(orderId);
        }
    });
});