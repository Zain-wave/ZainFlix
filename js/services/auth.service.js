// ZainFlix Authentication Service
class AuthService {
    constructor() {
        this.USER_SESSION_KEY = 'userSession';
        this.SELECTED_PROFILE_KEY = 'selectedProfile';
        this.REMEMBER_USER_KEY = 'rememberUser';
    }

    // Check if user is logged in
    isLoggedIn() {
        const userSession = localStorage.getItem(this.USER_SESSION_KEY);
        return userSession !== null;
    }

    // Get current user data
    getCurrentUser() {
        const userSession = localStorage.getItem(this.USER_SESSION_KEY);
        if (!userSession) return null;
        
        try {
            return JSON.parse(userSession);
        } catch (error) {
            console.error('Error parsing user session:', error);
            return null;
        }
    }

    // Get current selected profile
    getCurrentProfile() {
        const selectedProfile = localStorage.getItem(this.SELECTED_PROFILE_KEY);
        if (!selectedProfile) return null;
        
        try {
            return JSON.parse(selectedProfile);
        } catch (error) {
            console.error('Error parsing selected profile:', error);
            return null;
        }
    }

    // Check if user has selected profile
    hasSelectedProfile() {
        return this.getCurrentProfile() !== null;
    }

    // Protect routes - redirect based on auth state
    protectRoute() {
        const isLoggedIn = this.isLoggedIn();
        const hasProfile = this.hasSelectedProfile();
        
        // Get current page
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop() || 'index.html';
        
        console.log('Auth check:', { currentPage, isLoggedIn, hasProfile });
        
        if (isLoggedIn) {
            // User is logged in
            if (currentPage === 'index.html' || currentPage === '') {
                // On landing page but logged in - redirect to appropriate page
                if (hasProfile) {
                    window.location.href = 'home.html';
                } else {
                    window.location.href = 'profile.html';
                }
                return false;
            }
            
            if (currentPage === 'login.html' || currentPage === 'register.html') {
                // On auth pages but logged in - redirect to home
                if (hasProfile) {
                    window.location.href = 'home.html';
                } else {
                    window.location.href = 'profile.html';
                }
                return false;
            }
            
            // On protected pages but no profile selected
            if ((currentPage === 'home.html' || currentPage === 'mylist.html') && !hasProfile) {
                window.location.href = 'profile.html';
                return false;
            }
            
            // User is properly authenticated for current page
            // NO redirigir desde profile.html para permitir selección de perfil
            return true;
            
        } else {
            // User is not logged in
            const protectedPages = ['home.html', 'mylist.html'];
            
            // profile.html está permitido sin login para permitir el flujo de login->perfil
            if (protectedPages.includes(currentPage)) {
                // On protected page but not logged in - redirect to landing
                window.location.href = 'index.html';
                return false;
            }
            
            // User is properly on public page
            return true;
        }
    }

    // Login user
    login(userData, rememberMe = false) {
        try {
            localStorage.setItem(this.USER_SESSION_KEY, JSON.stringify(userData));
            
            if (rememberMe) {
                localStorage.setItem(this.REMEMBER_USER_KEY, 'true');
            }
            
            console.log('User logged in:', userData.email);
            return true;
        } catch (error) {
            console.error('Error during login:', error);
            return false;
        }
    }

    // Logout user
    logout() {
        try {
            // Note: MyList data is preserved in localStorage under zainflix_mylist key
            localStorage.removeItem(this.USER_SESSION_KEY);
            localStorage.removeItem(this.SELECTED_PROFILE_KEY);
            localStorage.removeItem(this.REMEMBER_USER_KEY);
            
            console.log('User logged out');
            return true;
        } catch (error) {
            console.error('Error during logout:', error);
            return false;
        }
    }

    // Select profile
    selectProfile(profileData) {
        try {
            const selectedProfile = {
                name: profileData.name,
                theme: profileData.theme || 'default',
                selectedTime: new Date().toISOString(),
            };
            
            localStorage.setItem(this.SELECTED_PROFILE_KEY, JSON.stringify(selectedProfile));
            console.log('Profile selected:', profileData.name);
            return true;
        } catch (error) {
            console.error('Error selecting profile:', error);
            return false;
        }
    }

    // Get redirect URL for user
    getRedirectUrl() {
        if (!this.isLoggedIn()) {
            return 'index.html';
        }
        
        if (!this.hasSelectedProfile()) {
            return 'profile.html';
        }
        
        return 'home.html';
    }

    // Initialize auth on page load
    initAuth() {
        // Run protection check
        if (!this.protectRoute()) {
            return; // Will redirect automatically
        }
        
        // Additional auth setup can go here
        console.log('Auth initialized successfully');
    }
}

// Export for use in other files
window.AuthService = new AuthService();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.AuthService.initAuth();
        }, 100);
    });
} else {
    setTimeout(() => {
        window.AuthService.initAuth();
    }, 100);
}