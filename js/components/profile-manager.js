// ZainFlix Profile Manager - Shared Component
class ProfileManager {
    constructor() {
        this.profiles = {
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

    init() {
        this.updateProfileAvatar();
        this.setupProfileMenu();
    }

    getSelectedProfile() {
        const profileData = localStorage.getItem('selectedProfile');
        return profileData ? JSON.parse(profileData) : null;
    }

    updateProfileAvatar() {
        const selectedProfile = this.getSelectedProfile();
        const profileAvatar = document.querySelector('.profile-avatar');
        
        if (selectedProfile && profileAvatar) {
            const profile = this.profiles[selectedProfile.name];
            if (profile) {
                profileAvatar.style.backgroundImage = `url('${profile.avatar}')`;
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
                ${Object.entries(this.profiles).map(([name, profile]) => `
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
        const profile = this.profiles[profileName];
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
            
            // Reload page to update content if needed
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }

    signOut() {
        localStorage.removeItem('userSession');
        localStorage.removeItem('selectedProfile');
        localStorage.removeItem('rememberUser');
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
}

export { ProfileManager };