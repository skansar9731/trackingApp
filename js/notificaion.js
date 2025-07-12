// Sample notification data
        const notifications = [
            {
                id: 1,
                title: "New Order Update",
                message: "Your order #PO-2023-456 has moved to Production stage",
                time: "10 minutes ago",
                read: false,
                type: "order_update"
            },
            {
                id: 2,
                title: "System Maintenance",
                message: "Scheduled maintenance on Saturday, 10:00 PM to 12:00 AM",
                time: "2 hours ago",
                read: false,
                type: "system"
            },
            {
                id: 3,
                title: "Order Delivered",
                message: "Your order #PO-2023-123 has been successfully delivered",
                time: "1 day ago",
                read: true,
                type: "order_complete"
            },
            {
                id: 4,
                title: "New Feature Available",
                message: "You can now track your orders in real-time on the dashboard",
                time: "3 days ago",
                read: true,
                type: "feature"
            }
        ];

        // DOM Elements
        const notificationsContainer = document.getElementById('notificationsContainer');
        const emptyState = document.getElementById('emptyState');
        const notificationBadge = document.getElementById('notificationBadge');

        // Initialize page
        document.addEventListener('DOMContentLoaded', function() {
            // Load user name
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            if (currentUser) {
                document.getElementById('customerName').textContent = currentUser.username;
            } else {
                window.location.href = 'customer-login.html';
            }

            // Load notifications
            loadNotifications();
            
            // Update badge count
            updateBadgeCount();
        });

        // Load notifications
        function loadNotifications() {
            notificationsContainer.innerHTML = '';
            
            if (notifications.length === 0) {
                emptyState.style.display = 'block';
                return;
            }
            
            emptyState.style.display = 'none';
            
            notifications.forEach(notification => {
                const notificationCard = document.createElement('div');
                notificationCard.className = `notification-card ${notification.read ? '' : 'unread'}`;
                notificationCard.innerHTML = `
                    <div class="notification-icon">
                        ${getNotificationIcon(notification.type)}
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">
                            <span>${notification.title}</span>
                            <span class="notification-time">${notification.time}</span>
                        </div>
                        <p class="notification-message">${notification.message}</p>
                        <div class="notification-actions">
                            ${!notification.read ? 
                                `<button class="action-btn" onclick="markAsRead(${notification.id})">
                                    <i class="fas fa-check"></i> Mark as read
                                </button>` : ''}
                            <button class="action-btn" onclick="viewDetails(${notification.id})">
                                <i class="fas fa-eye"></i> View details
                            </button>
                        </div>
                    </div>
                `;
                notificationsContainer.appendChild(notificationCard);
            });
        }

        // Get appropriate icon for notification type
        function getNotificationIcon(type) {
            const icons = {
                'order_update': '<i class="fas fa-truck"></i>',
                'order_complete': '<i class="fas fa-check-circle"></i>',
                'system': '<i class="fas fa-server"></i>',
                'feature': '<i class="fas fa-star"></i>'
            };
            return icons[type] || '<i class="fas fa-info-circle"></i>';
        }

        // Mark notification as read
        function markAsRead(id) {
            const notification = notifications.find(n => n.id === id);
            if (notification) {
                notification.read = true;
                loadNotifications();
                updateBadgeCount();
            }
        }

        // Mark all notifications as read
        function markAllAsRead() {
            notifications.forEach(notification => {
                notification.read = true;
            });
            loadNotifications();
            updateBadgeCount();
        }

        // View notification details
        function viewDetails(id) {
            // In a real app, this would navigate to the relevant page
            alert(`Viewing details for notification #${id}`);
            markAsRead(id);
        }

        // Refresh notifications
        function refreshNotifications() {
            // In a real app, this would fetch new notifications from the server
            alert('Refreshing notifications...');
            loadNotifications();
        }

        // Update badge count
        function updateBadgeCount() {
            const unreadCount = notifications.filter(n => !n.read).length;
            notificationBadge.textContent = unreadCount;
            notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }

        // Toggle mobile menu
        function toggleMenu() {
            const navLinks = document.getElementById('navLinks');
            navLinks.classList.toggle('show');
        }

        // Logout function
        function logout() {
            sessionStorage.removeItem('currentUser');
            window.location.href = 'customer-login.html';
        }