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
    
    let date;
    if (typeof dateString === 'string') {
        date = new Date(dateString);
        if (isNaN(date.getTime())) {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                date = new Date(year, month, day);
            }
        }
    } else if (dateString instanceof Date) {
        date = dateString;
    }
    
    if (isNaN(date.getTime())) return 'N/A';
    
    return date.getDate().toString().padStart(2, '0') + '-' + 
           (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
           date.getFullYear();
}

function convertToDDMMYYYY(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.getDate().toString().padStart(2, '0') + '-' + 
           (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
           date.getFullYear();
}

document.addEventListener('DOMContentLoaded', function () {
    // Check authentication
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

        filterOrders(searchTerm);
    });

    // Date range filtering
    document.getElementById('startDate').addEventListener('change', function() {
        filterOrders(document.getElementById('searchInput').value.toLowerCase());
    });
    
    document.getElementById('endDate').addEventListener('change', function() {
        filterOrders(document.getElementById('searchInput').value.toLowerCase());
    });

    // Export functionality
    document.getElementById('exportBtn').addEventListener('click', exportToExcel);
    
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
 loadCustomerOrders(null); // Pass null to show all orders
    updateStatistics(); // This will show totals for all customers
    // Initialize pagination
    function initializePagination(orders) {
        const totalItems = orders.length;
        totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        document.getElementById('currentPage').textContent = currentPage;
        document.getElementById('totalPages').textContent = totalPages;
        
        document.getElementById('prevPage').disabled = currentPage === 1;
        document.getElementById('nextPage').disabled = currentPage === totalPages;
    }

    // Update orders display with pagination
    function updateOrdersDisplay(orders) {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageOrders = orders.slice(startIndex, endIndex);
        
        const ordersBody = document.getElementById('ordersBody');
        ordersBody.innerHTML = '';
        
        pageOrders.forEach(order => {
            ordersBody.appendChild(createOrderRow(order));
        });
        
        initializePagination(orders);
    }

    // Handle page change
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            filterOrders(document.getElementById('searchInput').value.toLowerCase());
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            filterOrders(document.getElementById('searchInput').value.toLowerCase());
        }
    });

    function filterOrders(searchTerm = '') {
        const customerId = document.getElementById('customerSelect').value;
        if (!customerId) return;
        
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        let filteredOrders = orders.filter(order => order.customerId === customerId);
        
        if (startDate || endDate) {
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.date);
                const start = startDate ? new Date(startDate) : new Date(0);
                const end = endDate ? new Date(endDate) : new Date();
                return orderDate >= start && orderDate <= end;
            });
        }
        
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
        
        updateOrdersDisplay(filteredOrders);
        updateStatistics();
    }

    function exportToExcel() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const customerId = document.getElementById('customerSelect').value;
        
        if (!customerId) {
            showToast('Please select a customer first', true);
            return;
        }

        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const filteredOrders = orders.filter(order => {
            if (order.customerId !== customerId) return false;
            
            const orderDate = new Date(order.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return orderDate >= start && orderDate <= end;
        });

        if (filteredOrders.length === 0) {
            showToast('No orders found for the selected date range', true);
            return;
        }

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
        showToast('Export completed successfully!');
    }

    // Add new order button
    document.getElementById('addOrderBtn').addEventListener('click', function () {
        const customerId = document.getElementById('customerSelect').value;
        if (!customerId) {
            showToast('Please select a customer first', true);
            return;
        }

        addNewOrderRow(customerId);
    });

    // Customer select change
 document.getElementById('customerSelect').addEventListener('change', function() {
    const customerId = this.value;
    const customers = JSON.parse(localStorage.getItem('customers')) || [];
    const selectedCustomer = customers.find(c => c.id === customerId);

    if (customerId) {
        // Update customer name display
        document.getElementById('selectedCustomerName').textContent = 
            selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.mobile})` : 'None';
        
        // Load and display orders for selected customer
        loadCustomerOrders(customerId);
    } else {
        // Reset display when no customer selected
        document.getElementById('selectedCustomerName').textContent = 'None';
        document.getElementById('ordersBody').innerHTML = '';
    }
    
    // Always update statistics
    updateStatistics();
});
function loadCustomerOrders(customerId) {
    console.log('Loading orders for customer:', customerId);
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const customerOrders = customerId 
        ? orders.filter(order => order.customerId === customerId)
        : orders; // Show all orders when no customer is selected
    
    const tbody = document.getElementById('ordersBody');
    tbody.innerHTML = '';

    if (customerOrders.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="10" class="no-orders">No orders found</td>';
        tbody.appendChild(tr);
    } else {
        customerOrders.forEach(order => {
            tbody.appendChild(createOrderRow(order));
        });
    }
    
    updateStatistics(); // This will now show totals for all customers when no customer is selected
}

    // Order operations functions
    function loadCustomers() {
        const customers = JSON.parse(localStorage.getItem('customers')) || [];
        const select = document.getElementById('customerSelect');

        select.innerHTML = '<option value="">Select a customer</option>';
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = `${customer.name} (${customer.mobile})`;
            select.appendChild(option);
        });
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

    // Event delegation for order operations
    document.getElementById('ordersBody').addEventListener('click', function(e) {
        const button = e.target.closest('button');
        if (!button) return;
        
        const row = e.target.closest('tr');
        if (!row) return;
        
        const orderId = row.dataset.id;
        
        if (button.classList.contains('edit-btn')) {
            enableEditMode(orderId);
        } else if (button.classList.contains('update-btn')) {
            updateOrder(orderId);
        } else if (button.classList.contains('cancel-btn')) {
            if (row.dataset.id.startsWith('new-')) {
                cancelOrder(orderId);
            } else {
                cancelEditMode(orderId);
            }
        } else if (button.classList.contains('delete-btn')) {
            deleteOrder(orderId);
        } else if (button.classList.contains('create-btn')) {
            createOrder(orderId);
        }
    });

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
        filterOrders();
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
            filterOrders();
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
                filterOrders();
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
        
        if (order || row.dataset.id.startsWith('new-')) {
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
            
            if (row.dataset.id.startsWith('new-')) {
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

   function getStatusClass(status) {
    const statusMap = {
        'Order Booked': 'status-order-booked heartbeat',
        'Design': 'status-design heartbeat',
        'Assembly': 'status-assembly heartbeat',
        'Production': 'status-production heartbeat',
        'Quality Check': 'status-quality-check heartbeat',
        'Ready for dispatch': 'status-ready-dispatch heartbeat',
        'Dispatched': 'status-dispatched heartbeat',
        'Delivered': 'status-delivered heartbeat'
    };
    return statusMap[status] || 'status-pending heartbeat';
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
        
        // Add pulse animation when values change
        const stats = ['activeOrders', 'totalOrders', 'deliveredOrders'];
        stats.forEach(stat => {
            const element = document.getElementById(stat);
            element.classList.add('pulse');
            setTimeout(() => element.classList.remove('pulse'), 500);
        });
    } catch (error) {
        console.error("Error updating statistics:", error);
    }
}


    // Initialize Select2 if available
    if (typeof $ !== 'undefined' && $.fn.select2) {
        $('#customerSelect').select2({
            width: '100%',
            dropdownAutoWidth: true,
            placeholder: 'Select a customer',
            allowClear: true
        });
    }
});
window.loadCustomers = loadCustomers;