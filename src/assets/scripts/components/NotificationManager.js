// ZainFlix Notification Component - Unified Notification System
export class NotificationManager {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 3;
        this.defaultTimeout = 3000;
        this.init();
    }

    init() {
        // Create notification container if it doesn't exist
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
    }

    show(message, type = 'info', timeout = this.defaultTimeout) {
        const notification = this.createNotification(message, type);
        this.addNotification(notification, timeout);
        return notification;
    }

    success(message, timeout = this.defaultTimeout) {
        return this.show(message, 'success', timeout);
    }

    error(message, timeout = this.defaultTimeout) {
        return this.show(message, 'error', timeout);
    }

    warning(message, timeout = this.defaultTimeout) {
        return this.show(message, 'warning', timeout);
    }

    info(message, timeout = this.defaultTimeout) {
        return this.show(message, 'info', timeout);
    }

    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Add icon based on type
        const icons = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };

        const icon = icons[type] || 'info';
        
        notification.innerHTML = `
            <div class="notification-icon">
                <span class="material-symbols-outlined">${icon}</span>
            </div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" aria-label="Close notification">
                <span class="material-symbols-outlined">close</span>
            </button>
        `;

        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });

        return notification;
    }

    addNotification(notification, timeout) {
        const container = document.getElementById('notification-container');
        
        // Limit number of notifications
        if (this.notifications.length >= this.maxNotifications) {
            const oldestNotification = this.notifications.shift();
            this.removeNotification(oldestNotification);
        }

        container.appendChild(notification);
        this.notifications.push(notification);

        // Trigger entrance animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto remove after timeout
        if (timeout > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, timeout);
        }

        return notification;
    }

    removeNotification(notification) {
        if (!notification || !notification.parentElement) return;

        notification.classList.add('hide');
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
            
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }

    clearAll() {
        const container = document.getElementById('notification-container');
        if (container) {
            container.innerHTML = '';
        }
        this.notifications = [];
    }
}

// Global notification manager instance
export const notificationManager = new NotificationManager();

// Convenience functions for backward compatibility
export const showNotification = (message, type = 'info', timeout) => {
    return notificationManager.show(message, type, timeout);
};

// Export for legacy code that expects window.showNotification
if (typeof window !== 'undefined') {
    window.showNotification = showNotification;
    window.notificationManager = notificationManager;
}