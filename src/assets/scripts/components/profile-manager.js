// ZainFlix Profile Manager - Shared Component
class ProfileManager {
    constructor() {
        this.defaultProfiles = {
            'Katana': {
                icon: 'swords',
                color: '#f000ff',
                avatar: 'https://ui-avatars.com/api/?name=Katana&background=f000ff&color=fff&size=128'
            },
            'VR User': {
                icon: 'head_mounted_device',
                color: '#8b5cf6',
                avatar: 'https://ui-avatars.com/api/?name=VR+User&background=8b5cf6&color=fff&size=128'
            },
            'Robot': {
                icon: 'smart_toy',
                color: '#00f0ff',
                avatar: 'https://ui-avatars.com/api/?name=Robot&background=00f0ff&color=000&size=128'
            }
        };
        this.init();
    }

    getProfiles() {
        // Load custom profiles from localStorage and merge with defaults
        const customProfiles = this.getCustomProfiles();
        const allProfiles = { ...this.defaultProfiles, ...customProfiles };
        
        // Filter out deleted profiles for current user
        const filteredProfiles = {};
        Object.entries(allProfiles).forEach(([name, profile]) => {
            if (!this.isProfileDeleted(name)) {
                filteredProfiles[name] = profile;
            }
        });
        
        return filteredProfiles;
    }

    getCustomProfiles() {
        try {
            // Get current user session
            const userSession = localStorage.getItem("userSession");
            const userKey = userSession ? JSON.parse(userSession).email : 'default';
            
            const storageKey = `customProfiles_${userKey}`;
            const savedProfiles = localStorage.getItem(storageKey);
            return savedProfiles ? JSON.parse(savedProfiles) : {};
        } catch (error) {
            console.error('Error loading custom profiles:', error);
            return {};
        }
    }

    saveProfile(name, profileData) {
        try {
            const customProfiles = this.getCustomProfiles();
            customProfiles[name] = {
                ...profileData,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${profileData.color.replace('#', '')}&color=fff&size=128`
            };
            
            // Get current user session
            const userSession = localStorage.getItem("userSession");
            const userKey = userSession ? JSON.parse(userSession).email : 'default';
            const storageKey = `customProfiles_${userKey}`;
            
            localStorage.setItem(storageKey, JSON.stringify(customProfiles));
            console.log('Profile saved for user:', userKey, name, profileData);
        } catch (error) {
            console.error('Error saving profile:', error);
        }
    }

    getProfile(name) {
        const profiles = this.getProfiles();
        const profile = profiles[name];
        
        // Check if this profile is deleted for the current user
        if (profile && this.isProfileDeleted(name)) {
            console.log('Profile is deleted for current user:', name);
            return null;
        }
        
        return profile || null;
    }

    isProfileDeleted(name) {
        try {
            // Get current user session
            const userSession = localStorage.getItem("userSession");
            const userKey = userSession ? JSON.parse(userSession).email : 'default';
            
            const deletedKey = `deletedProfiles_${userKey}`;
            const deletedProfiles = localStorage.getItem(deletedKey);
            if (deletedProfiles) {
                const deleted = JSON.parse(deletedProfiles);
                return deleted.includes(name);
            }
            return false;
        } catch (error) {
            console.error('Error checking deleted profiles:', error);
            return false;
        }
    }

    init() {
        this.updateProfileAvatar();
        this.setupProfileMenu();
        
        // Listen for storage changes from other tabs
        window.addEventListener('storage', (e) => {
            // Check if it's a profile-related key for any user
            if (e.key && (e.key.startsWith('customProfiles_') || e.key.startsWith('deletedProfiles_') || e.key === 'selectedProfile' || e.key === 'userSession')) {
                this.refreshOnUserChange();
            }
        });

        // Listen for page visibility changes (user returns from profile page)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshOnUserChange();
            }
        });

        // Also check when window gets focus
        window.addEventListener('focus', () => {
            this.refreshOnUserChange();
        });

        // Check user changes periodically (every 2 seconds)
        setInterval(() => {
            this.refreshOnUserChange();
        }, 2000);
    }

    getSelectedProfile() {
        const profileData = localStorage.getItem('selectedProfile');
        return profileData ? JSON.parse(profileData) : null;
    }

    updateProfileAvatar() {
        const selectedProfile = this.getSelectedProfile();
        const profileAvatar = document.querySelector('.profile-avatar');
        
        if (selectedProfile && profileAvatar) {
            const profiles = this.getProfiles();
            const profile = profiles[selectedProfile.name];
            if (profile) {
                profileAvatar.style.backgroundImage = `url('${profile.avatar}')`;
                console.log('Updated avatar for profile:', selectedProfile.name, 'with avatar:', profile.avatar);
            } else {
                console.warn('Profile not found:', selectedProfile.name);
            }
        }
    }

    setupProfileMenu() {
        const profileAvatar = document.querySelector('.profile-avatar');
        if (!profileAvatar) return;

        // Remove existing dropdown if any
        const existingDropdown = document.querySelector('.profile-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }

        // Create dropdown menu
        const dropdown = document.createElement('div');
        dropdown.className = 'profile-dropdown';
        dropdown.innerHTML = `
            <div class="dropdown-header">Switch Profile</div>
            <div class="dropdown-content">
                ${Object.entries(this.getProfiles()).map(([name, profile]) => `
                    <div class="dropdown-item" data-profile="${name}">
                        <div class="dropdown-avatar" style="background-image: url('${profile.avatar}')"></div>
                        <span class="dropdown-name">${name}</span>
                    </div>
                `).join('')}
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" id="manage-profiles">
                    <span class="material-symbols-outlined">settings</span>
                    <span>Manage Profiles</span>
                </div>
                <div class="dropdown-item" id="sign-out">
                    <span class="material-symbols-outlined">logout</span>
                    <span>Sign Out</span>
                </div>
            </div>
        `;

        // Add dropdown to body
        document.body.appendChild(dropdown);

        // Toggle dropdown on click
        profileAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        // Handle profile selection
        dropdown.querySelectorAll('.dropdown-item[data-profile]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const profileName = item.dataset.profile;
                this.switchProfile(profileName);
                dropdown.classList.remove('show');
            });
        });

        // Handle manage profiles
        dropdown.querySelector('#manage-profiles').addEventListener('click', (e) => {
            e.stopPropagation();
            window.location.href = 'profile.html';
        });

        // Handle sign out
        dropdown.querySelector('#sign-out').addEventListener('click', (e) => {
            e.stopPropagation();
            this.signOut();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });
    }

    switchProfile(profileName) {
        const profiles = this.getProfiles();
        const profile = profiles[profileName];
        if (profile) {
            const selectedProfile = {
                name: profileName,
                theme: profile.color,
                selectedTime: new Date().toISOString(),
            };

            localStorage.setItem('selectedProfile', JSON.stringify(selectedProfile));
            this.updateProfileAvatar();
            
            // Show brief notification
            this.showNotification(`Switched to ${profileName}`);
        } else {
            console.warn('Profile not found:', profileName);
        }
    }

    signOut() {
        // Get current user before clearing
        const userSession = localStorage.getItem('userSession');
        const userKey = userSession ? JSON.parse(userSession).email : 'default';
        
        // Clear authentication
        localStorage.removeItem('userSession');
        localStorage.removeItem('selectedProfile');
        localStorage.removeItem('rememberUser');
        
        // Clean up user-specific data if not remembering user
        const rememberUser = localStorage.getItem('rememberUser');
        if (!rememberUser) {
          console.log('Clearing session data for user:', userKey);
          // Remove any temporary session data but keep profiles for future logins
        }
        
        window.location.href = 'index.html';
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'profile-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }

    refreshProfiles() {
        // Force reload of profiles and UI
        this.setupProfileMenu();
        this.updateProfileAvatar();
        console.log('Profiles refreshed');
    }

    // Refresh when user data changes
    refreshOnUserChange() {
        const lastUserSession = this.lastUserSession;
        const currentUserSession = localStorage.getItem('userSession');
        
        if (lastUserSession !== currentUserSession) {
            console.log('User session changed, refreshing profiles');
            this.lastUserSession = currentUserSession;
            this.refreshProfiles();
        }
    }

    // Check for profile changes when page becomes visible
    checkForProfileChanges() {
        const lastProfilesHash = this.profilesHash || '';
        const currentProfiles = JSON.stringify(this.getProfiles());
        const currentHash = this.hashCode(currentProfiles);
        
        if (lastProfilesHash !== currentHash) {
            this.profilesHash = currentHash;
            this.refreshProfiles();
            console.log('Profile changes detected and refreshed');
        }
    }

    // Simple hash function for detecting changes
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }
}

// Export for modules
export { ProfileManager };

// Make available globally for non-module scripts
if (typeof window !== 'undefined') {
    window.ProfileManager = ProfileManager;
}