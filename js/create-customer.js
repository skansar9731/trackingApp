// create-customer.js
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded - create-customer.js");
    
    // Debug localStorage
    console.log("Customers in localStorage:", JSON.parse(localStorage.getItem('customers')));
    
    // Check authentication
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
   // Initialize data
    initializeStorage();

    // Load customers dropdown
    loadCustomers();

    // Event listeners
    setupEventListeners();
    // Initialize data
    if (!localStorage.getItem('customers')) {
        localStorage.setItem('customers', JSON.stringify([]));
    }
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    if (!localStorage.getItem('notifications')) {
        localStorage.setItem('notifications', JSON.stringify([]));
    }

    // Load customers dropdown
    loadCustomers();

    // Customer select change
    document.getElementById('customerSelect').addEventListener('change', function() {
        updateSelectedCustomerDisplay();
    });

    // Customer form submission
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
        const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
        
        if (isEditMode) {
            // EDIT MODE - Update existing customer
            const customerIndex = customers.findIndex(c => c.id === editingCustomerId);
            const userIndex = users.findIndex(u => u.id === editingCustomerId);
            
            if (customerIndex === -1 || userIndex === -1) {
                showToast('Customer not found', true);
                return;
            }
            
            // Check if username is being changed to one that already exists
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
                password,
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
            
            // Add notification
            notifications.push({
                type: 'customer_updated',
                username,
                mobile,
                timestamp: new Date().toISOString()
            });
            
            localStorage.setItem('customers', JSON.stringify(customers));
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('notifications', JSON.stringify(notifications));
            
            showToast('Customer updated successfully!');
            
            // Clear the form and exit edit mode
            this.reset();
            document.getElementById('selectedCustomerName').textContent = 'None';
            sessionStorage.removeItem('editingCustomerId');
            toggleEditModeButtons(false);
            loadCustomers();
        } else {
            // CREATE MODE - Create new customer
            if (users.some(u => u.username === username) || 
                customers.some(c => c.username === username)) {
                showToast('Username already exists', true);
                return;
            }
            
            // Create customer object
            const newCustomer = {
                id: Date.now().toString(),
                name,
                mobile,
                username,
                password,
                projectNo: document.getElementById('projectNo').value.trim(),
                designer: document.getElementById('designer').value.trim(),
                poNumber: document.getElementById('poNumber').value.trim(),
                orderDate: document.getElementById('orderDate').value.trim()
            };
            
            // Create user object
            const newUser = {
                id: newCustomer.id,
                username,
                password,
                role: 'customer',
                name,
                mobile
            };
            
            // Add notification
            notifications.push({
                type: 'customer_created',
                username,
                mobile,
                timestamp: new Date().toISOString()
            });
            
            // Save to both collections
            customers.push(newCustomer);
            users.push(newUser);
            
            localStorage.setItem('customers', JSON.stringify(customers));
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('notifications', JSON.stringify(notifications));
            
            showToast('Customer created successfully!');
            this.reset();
            loadCustomers();
        }
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
            document.getElementById('username').value = customer.username || '';
            document.getElementById('password').value = customer.password || '';
            
            toggleEditModeButtons(true);
            sessionStorage.setItem('editingCustomerId', customerId);
            showToast('Editing customer credentials');
        }
    });

    // View customer details
    document.getElementById('viewCustomerBtn').addEventListener('click', function() {
        const customerId = document.getElementById('customerSelect').value;
        if (!customerId) {
            showToast('Please select a customer first', true);
            return;
        }

        const customers = JSON.parse(localStorage.getItem('customers')) || [];
        const customer = customers.find(c => c.id === customerId);

        if (customer) {
            const modalContent = document.getElementById('modalContent');
            modalContent.innerHTML = `
                <h3>${customer.name || 'N/A'}</h3>
                <p><strong>Mobile:</strong> ${customer.mobile || 'N/A'}</p>
                <p><strong>Project No:</strong> ${customer.projectNo || 'N/A'}</p>
                <p><strong>Designer:</strong> ${customer.designer || 'N/A'}</p>
                <p><strong>PO Number:</strong> ${customer.poNumber || 'N/A'}</p>
                <p><strong>Order Date:</strong> ${formatDate(customer.orderDate) || 'N/A'}</p>
                <p><strong>Username:</strong> ${customer.username || 'N/A'}</p>
                <p><strong>Password:</strong> ${customer.password || 'N/A'}</p>
            `;
            
            document.getElementById('customerDetailsModal').style.display = 'flex';
        }
    });

    // Close modal
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('close-modal') || 
            e.target === document.getElementById('customerDetailsModal')) {
            document.getElementById('customerDetailsModal').style.display = 'none';
        }
    });

    // Cancel edit
    document.getElementById('cancelEditBtn').addEventListener('click', function() {
        sessionStorage.removeItem('editingCustomerId');
        document.getElementById('customerForm').reset();
        toggleEditModeButtons(false);
        showToast('Edit cancelled');
    });

    // Delete customer
    document.getElementById('deleteCustomerBtn').addEventListener('click', function() {
        const customerId = sessionStorage.getItem('editingCustomerId');
        if (!customerId) {
            showToast('No customer selected for deletion', true);
            return;
        }

        if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            const customers = JSON.parse(localStorage.getItem('customers')) || [];
            const orders = JSON.parse(localStorage.getItem('orders')) || [];
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const notifications = JSON.parse(localStorage.getItem('notifications')) || [];

            // Get customer before deleting
            const customer = customers.find(c => c.id === customerId);
            
            // Remove customer's orders
            const updatedOrders = orders.filter(order => order.customerId !== customerId);
            localStorage.setItem('orders', JSON.stringify(updatedOrders));

            // Remove customer
            const updatedCustomers = customers.filter(c => c.id !== customerId);
            localStorage.setItem('customers', JSON.stringify(updatedCustomers));

            // Remove user
            const updatedUsers = users.filter(u => u.id !== customerId);
            localStorage.setItem('users', JSON.stringify(updatedUsers));

            // Add notification
            if (customer) {
                notifications.push({
                    type: 'customer_deleted',
                    username: customer.username,
                    name: customer.name,
                    timestamp: new Date().toISOString()
                });
                localStorage.setItem('notifications', JSON.stringify(notifications));
            }

            // Exit edit mode
            sessionStorage.removeItem('editingCustomerId');
            document.getElementById('customerForm').reset();
            toggleEditModeButtons(false);
            loadCustomers();
            showToast('Customer and their orders deleted successfully!');
        }
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

    // Helper functions
    function loadCustomers() {
        console.log("Loading customers...");
        const customers = JSON.parse(localStorage.getItem('customers')) || [];
        const select = document.getElementById('customerSelect');
        
        console.log("Select element:", select);
        console.log(`Found ${customers.length} customers to load`);
        
        // Clear existing options
        select.innerHTML = '<option value="">Select a customer</option>';
        
        // Add customer options
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = `${customer.name} (${customer.mobile})`;
            select.appendChild(option);
            console.log("Added option:", option.textContent);
        });
        
        // Initialize Select2 after populating options
        if (typeof $ !== 'undefined' && $.fn.select2) {
            console.log("Initializing Select2");
            $(select).select2({
                width: '100%'
            }).on('change', function(e) {
                console.log("Select2 change event");
                updateSelectedCustomerDisplay();
            });
        } else {
            console.log("Using native select");
            select.addEventListener('change', updateSelectedCustomerDisplay);
        }
        
        // Manually trigger the change event to update display
        updateSelectedCustomerDisplay();
    }

    function updateSelectedCustomerDisplay() {
        const select = document.getElementById('customerSelect');
        const customerId = select.value;
        const customers = JSON.parse(localStorage.getItem('customers')) || [];
        const selectedCustomer = customers.find(c => c.id === customerId);
        const displayElement = document.getElementById('selectedCustomerName');
        
        console.log("Updating display for customer ID:", customerId);
        console.log("Selected customer:", selectedCustomer);
        
        if (selectedCustomer) {
            displayElement.textContent = `${selectedCustomer.name} (${selectedCustomer.mobile})`;
            console.log("Display updated to:", displayElement.textContent);
        } else {
            displayElement.textContent = 'None';
            console.log("Display reset to None");
        }
    }

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
     // Helper functions
     
     function initializeStorage() {
         if (!localStorage.getItem('customers')) {
             localStorage.setItem('customers', JSON.stringify([]));
         }
         if (!localStorage.getItem('users')) {
             localStorage.setItem('users', JSON.stringify([]));
         }
     }
 
     function setupEventListeners() {
         // Customer select change
         $('#customerSelect').on('change', function() {
             console.log("Select2 change event");
             updateSelectedCustomerDisplay();
         });
 
         // Form submission
         document.getElementById('customerForm').addEventListener('submit', function(e) {
             e.preventDefault();
             handleCustomerFormSubmit();
         });
 
         // Edit button
         document.getElementById('editCustomerBtn').addEventListener('click', handleEditClick);
 
         // Update button
         document.getElementById('updateCustomerBtn').addEventListener('click', function() {
             // Trigger form submission
             document.getElementById('customerForm').dispatchEvent(new Event('submit'));
         });
 
         // Cancel button
         document.getElementById('cancelEditBtn').addEventListener('click', handleCancelEdit);
 
         // Delete button
         document.getElementById('deleteCustomerBtn').addEventListener('click', handleDeleteCustomer);
     }
 
 function handleCustomerFormSubmit(e) {
        e.preventDefault();
        const isEditMode = sessionStorage.getItem('editingCustomerId') !== null;
        const editingCustomerId = sessionStorage.getItem('editingCustomerId');
        
        // Get form values
        const formData = getFormData();
        
        // Silent validation for edit mode
        if (isEditMode) {
            if (!formData.name || !formData.mobile || !formData.username || !formData.password) {
                return; // Fail silently in edit mode
            }
            updateCustomer(editingCustomerId, formData);
        } 
        // Show validation for create mode
        else {
            if (!formData.name || !formData.mobile || !formData.username || !formData.password) {
                showToast('All fields are required', true);
                return;
            }
            createCustomer(formData);
        }
    }
     function getFormData() {
         return {
             name: document.getElementById('custName').value.trim(),
             mobile: document.getElementById('mobile').value.trim(),
             username: document.getElementById('username').value.trim(),
             password: document.getElementById('password').value.trim(),
             projectNo: document.getElementById('projectNo').value.trim(),
             designer: document.getElementById('designer').value.trim(),
             poNumber: document.getElementById('poNumber').value.trim(),
             orderDate: document.getElementById('orderDate').value.trim()
         };
     }
 
     function validateFormData(formData) {
         if (!formData.name || !formData.mobile || !formData.username || !formData.password) {
             showToast('All fields are required', true);
             return false;
         }
         return true;
     }
 
     function updateCustomer(customerId, formData) {
         const customers = JSON.parse(localStorage.getItem('customers')) || [];
         const users = JSON.parse(localStorage.getItem('users')) || [];
         
         const customerIndex = customers.findIndex(c => c.id === customerId);
         const userIndex = users.findIndex(u => u.id === customerId);
         
         if (customerIndex === -1 || userIndex === -1) {
             showToast('Customer not found', true);
             return;
         }
         
         // Check for duplicate username
         if (formData.username !== customers[customerIndex].username) {
             if (isUsernameExists(formData.username, customerId)) {
                 showToast('Username already exists', true);
                 return;
             }
         }
         
         // Update customer
         customers[customerIndex] = {
             ...customers[customerIndex],
             ...formData
         };
         
         // Update user
         users[userIndex] = {
             ...users[userIndex],
             username: formData.username,
             password: formData.password,
             name: formData.name,
             mobile: formData.mobile
         };
         
         // Save changes
         localStorage.setItem('customers', JSON.stringify(customers));
         localStorage.setItem('users', JSON.stringify(users));
         
         // Reset form
         resetFormAfterUpdate();
         
         showToast('Customer updated successfully!');
     }
 
     function isUsernameExists(username, excludeId) {
         const users = JSON.parse(localStorage.getItem('users')) || [];
         const customers = JSON.parse(localStorage.getItem('customers')) || [];
         
         return users.some(u => u.username === username && u.id !== excludeId) || 
                customers.some(c => c.username === username && c.id !== excludeId);
     }
 
     function resetFormAfterUpdate() {
         document.getElementById('customerForm').reset();
         document.getElementById('selectedCustomerName').textContent = 'None';
         sessionStorage.removeItem('editingCustomerId');
         toggleEditModeButtons(false);
         loadCustomers();
         
         // Remove highlights
         document.getElementById('username').classList.remove('highlight-field');
         document.getElementById('password').classList.remove('highlight-field');
     }
 
     function handleEditClick() {
         const customerId = document.getElementById('customerSelect').value;
         
         if (!customerId) {
             showToast('Please select a customer first', true);
             return;
         }
 
         const customers = JSON.parse(localStorage.getItem('customers')) || [];
         const customer = customers.find(c => c.id === customerId);
 
         if (customer) {
             // Fill form
             document.getElementById('custName').value = customer.name || '';
             document.getElementById('mobile').value = customer.mobile || '';
             document.getElementById('username').value = customer.username || '';
             document.getElementById('password').value = customer.password || '';
             document.getElementById('projectNo').value = customer.projectNo || '';
             document.getElementById('designer').value = customer.designer || '';
             document.getElementById('poNumber').value = customer.poNumber || '';
             document.getElementById('orderDate').value = customer.orderDate || '';
             
             // Highlight fields
             document.getElementById('username').classList.add('highlight-field');
             document.getElementById('password').classList.add('highlight-field');
             
             // Update display
             document.getElementById('selectedCustomerName').innerHTML = `
                 ${customer.name} (${customer.mobile}) - 
                 <span class="highlight-username">${customer.username}</span>
             `;
 
             toggleEditModeButtons(true);
             sessionStorage.setItem('editingCustomerId', customerId);
            //  showToast('Editing customer credentials - fields highlighted');
         }
     }
     function handleCancelEdit() {
        sessionStorage.removeItem('editingCustomerId');
        document.getElementById('customerForm').reset();
        document.getElementById('selectedCustomerName').textContent = 'None';
        toggleEditModeButtons(false);
        
        // Remove highlights
        document.getElementById('username').classList.remove('highlight-field');
        document.getElementById('password').classList.remove('highlight-field');
        
        showToast('Edit cancelled');
    }
     function handleDeleteCustomer() {
        const customerId = sessionStorage.getItem('editingCustomerId');
        if (!customerId) {
            showToast('No customer selected for deletion', true);
            return;
        }

        if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            const customers = JSON.parse(localStorage.getItem('customers')) || [];
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const orders = JSON.parse(localStorage.getItem('orders')) || [];

            // Filter out the customer and their orders
            const updatedCustomers = customers.filter(c => c.id !== customerId);
            const updatedUsers = users.filter(u => u.id !== customerId);
            const updatedOrders = orders.filter(o => o.customerId !== customerId);

            // Save changes
            localStorage.setItem('customers', JSON.stringify(updatedCustomers));
            localStorage.setItem('users', JSON.stringify(updatedUsers));
            localStorage.setItem('orders', JSON.stringify(updatedOrders));

            // Reset form
            resetFormAfterUpdate();
            showToast('Customer and their orders deleted successfully!');
        }
    }
});

// Make functions available globally
window.showToast = showToast;
window.formatDate = formatDate;
window.loadCustomers = loadCustomers;
window.toggleEditModeButtons = toggleEditModeButtons;