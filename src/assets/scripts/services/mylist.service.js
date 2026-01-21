// ZainFlix MyList Service
class MyListService {
    constructor() {
        this.storageKey = 'zainflix_mylist';
        this.init();
    }

    init() {
        // Initialize storage structure if it doesn't exist
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify({}));
        }
    }

    getCurrentUser() {
        // Get current user session
        const userSession = localStorage.getItem('userSession');
        if (!userSession) return null;

        const userData = JSON.parse(userSession);
        return userData.email;
    }

    getCurrentProfile() {
        // Get current selected profile
        const selectedProfile = localStorage.getItem('selectedProfile');
        if (!selectedProfile) return null;

        return JSON.parse(selectedProfile);
    }

    getUserListKey() {
        const user = this.getCurrentUser();
        const profile = this.getCurrentProfile();
        
        if (!user) return null;
        
        // Create unique key: user_email + profile_name
        const profileName = profile ? profile.name : 'default';
        return `${user}_${profileName}`;
    }

    getMyList() {
        const allLists = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        const userKey = this.getUserListKey();
        
        if (!userKey) return [];
        
        return allLists[userKey] || [];
    }

    addToMyList(movieData) {
        const userKey = this.getUserListKey();
        if (!userKey) {
            console.error('No user or profile selected');
            return false;
        }

        const allLists = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        const userList = allLists[userKey] || [];

        // Check if movie already exists
        const existingIndex = userList.findIndex(movie => movie.id === movieData.id);
        if (existingIndex !== -1) {
            console.log('Movie already in list');
            return false;
        }

        // Add movie with timestamp
        const movieWithMetadata = {
            ...movieData,
            addedAt: new Date().toISOString(),
            addedFrom: 'home'
        };

        userList.push(movieWithMetadata);
        allLists[userKey] = userList;

        localStorage.setItem(this.storageKey, JSON.stringify(allLists));
        console.log('Movie added to My List:', movieData.title);
        return true;
    }

    removeFromMyList(movieId) {
        const userKey = this.getUserListKey();
        if (!userKey) return false;

        const allLists = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        const userList = allLists[userKey] || [];

        const filteredList = userList.filter(movie => movie.id !== movieId);
        
        if (filteredList.length === userList.length) {
            console.log('Movie not found in list');
            return false;
        }

        allLists[userKey] = filteredList;
        localStorage.setItem(this.storageKey, JSON.stringify(allLists));
        console.log('Movie removed from My List:', movieId);
        return true;
    }

    isInMyList(movieId) {
        const userList = this.getMyList();
        return userList.some(movie => movie.id === movieId);
    }

    toggleMyList(movieData) {
        if (this.isInMyList(movieData.id)) {
            return this.removeFromMyList(movieData.id) ? 'removed' : 'error';
        } else {
            return this.addToMyList(movieData) ? 'added' : 'error';
        }
    }

    getAllUsersLists() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    }

    exportUserList() {
        const userList = this.getMyList();
        const user = this.getCurrentUser();
        const profile = this.getCurrentProfile();
        
        return {
            user: user,
            profile: profile?.name || 'default',
            movies: userList,
            exportedAt: new Date().toISOString()
        };
    }

    clearUserList() {
        const userKey = this.getUserListKey();
        if (!userKey) return false;

        const allLists = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        delete allLists[userKey];
        
        localStorage.setItem(this.storageKey, JSON.stringify(allLists));
        console.log('User list cleared');
        return true;
    }

    // UI Helper methods
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = 'mylist-notification show';
        
        if (type === 'success') {
            notification.style.backgroundColor = 'rgba(34, 197, 94, 0.9)';
            notification.style.color = 'white';
        } else if (type === 'error') {
            notification.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
            notification.style.color = 'white';
        } else if (type === 'info') {
            notification.style.backgroundColor = 'rgba(59, 130, 246, 0.9)';
            notification.style.color = 'white';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    updateButtonState(button, isInList) {
        if (!button) return;

        const icon = button.querySelector('.material-symbols-outlined');
        const text = button.querySelector('span:not(.material-symbols-outlined)');
        
        if (isInList) {
            icon.textContent = 'check';
            if (text) text.textContent = 'In My List';
            button.classList.add('in-list');
        } else {
            icon.textContent = 'add';
            if (text) text.textContent = 'My List';
            button.classList.remove('in-list');
        }
    }
}

export { MyListService };