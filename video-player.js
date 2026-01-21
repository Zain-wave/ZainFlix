// ZainFlix Video Player
class VideoPlayer {
    constructor() {
        this.videoData = null;
        this.player = null;
        this.isPlayerReady = false;
        this.isMuted = false;
        this.previousVolume = 70;
        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.loadVideoData();
        this.startHideControlsTimer();
    }

    // This function is called by YouTube IFrame API
    onYouTubeIframeAPIReady() {
        console.log('YouTube API Ready');
        this.isPlayerReady = true;
        this.initializePlayer();
    }

    setupElements() {
        // UI Elements
        this.backButton = document.getElementById('backButton');
        this.movieTitle = document.getElementById('movieTitle');
        this.movieInfo = document.getElementById('movieInfo');
        this.centerOverlay = document.getElementById('centerOverlay');
        this.topOverlay = document.getElementById('topOverlay');
        this.bottomControls = document.getElementById('bottomControls');
        
        // Control elements
        this.playButton = document.getElementById('playButton');
        this.replayButton = document.getElementById('replayButton');
        this.forwardButton = document.getElementById('forwardButton');
        this.volumeButton = document.getElementById('volumeButton');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeLevel = document.getElementById('volumeLevel');
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressPlayed = document.getElementById('progressPlayed');
        this.progressBuffered = document.getElementById('progressBuffered');
        this.fullscreenButton = document.getElementById('fullscreenButton');
        this.nextEpisodeButton = document.getElementById('nextEpisodeButton');
    }

    setupEventListeners() {
        // Navigation
        this.backButton?.addEventListener('click', () => this.goBack());

        // Playback controls
        this.playButton?.addEventListener('click', () => this.togglePlay());
        this.replayButton?.addEventListener('click', () => this.seek(-10));
        this.forwardButton?.addEventListener('click', () => this.seek(10));

        // Volume controls
        this.volumeButton?.addEventListener('click', () => this.toggleMute());
        this.volumeSlider?.addEventListener('click', (e) => this.setVolume(e));
        this.volumeSlider?.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.isDraggingVolume = true;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isDraggingVolume) {
                this.setVolume(e);
            }
        });
        
        document.addEventListener('mouseup', () => {
            this.isDraggingVolume = false;
        });

        // Progress bar
        this.progressContainer?.addEventListener('click', (e) => this.seekTo(e));

        // Fullscreen
        this.fullscreenButton?.addEventListener('click', () => this.toggleFullscreen());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Mouse movement to show controls
        document.addEventListener('mousemove', () => this.showControls());

        // Controls hover to prevent hiding
        this.topOverlay?.addEventListener('mouseenter', () => this.cancelHideTimer());
        this.bottomControls?.addEventListener('mouseenter', () => this.cancelHideTimer());
        this.topOverlay?.addEventListener('mouseleave', () => this.startHideControlsTimer());
        this.bottomControls?.addEventListener('mouseleave', () => this.startHideControlsTimer());
    }

    loadVideoData() {
        // Get video data from URL parameters or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const movieData = urlParams.get('data');
        
        if (movieData) {
            try {
                this.videoData = JSON.parse(decodeURIComponent(movieData));
                this.loadVideo();
            } catch (error) {
                console.error('Error parsing video data:', error);
                this.showError('Invalid video data');
            }
        } else {
            this.showError('No video data provided');
        }
    }

    async loadVideo() {
        if (!this.videoData) {
            this.showError('No video data available');
            return;
        }

        console.log('Loading video with data:', this.videoData);
        this.showLoading();
        
        try {
            // Update UI with movie info
            this.movieTitle.textContent = this.videoData.title || this.videoData.name || 'Unknown Title';
            this.movieInfo.textContent = this.getMovieInfo();

            // Update background
            this.updateBackground();

            // Load YouTube video
            await this.loadYouTubeVideo();

        } catch (error) {
            console.error('Error loading video:', error);
            this.showError('Failed to load video');
        }
    }

    async loadYouTubeVideo() {
        if (!this.videoData.key) {
            throw new Error('No video key available');
        }

        // Wait for YouTube API to be ready
        if (!this.isPlayerReady) {
            setTimeout(() => this.loadYouTubeVideo(), 100);
            return;
        }

        // Clean up any existing player before creating new one
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }

        this.initializePlayer();
    }

    initializePlayer() {
        if (!this.videoData || !this.isPlayerReady || this.player) return;

        console.log('Initializing YouTube player with video ID:', this.videoData.key);

        // Clear center overlay and create player container
        this.centerOverlay.innerHTML = '<div id="player" style="width: 100vw; height: 100vh; position: absolute; top: 0; left: 0;"></div>';

        this.player = new YT.Player('player', {
            height: '100vh',
            width: '100vw',
            videoId: this.videoData.key,
            host: 'https://www.youtube.com',
            playerVars: {
                'autoplay': 1,
                'controls': 0,
                'rel': 0,
                'showinfo': 0,
                'modestbranding': 1,
                'iv_load_policy': 3,
                'cc_load_policy': 1,
                'disablekb': 0,
                'enablejsapi': 1,
                'origin': window.location.origin,
                'widget_referrer': window.location.href,
                'fs': 1,
                'playsinline': 1
            },
            events: {
                'onReady': (event) => {
                    console.log('Player ready event fired');
                    this.onPlayerReady(event);
                },
                'onStateChange': (event) => this.onPlayerStateChange(event),
                'onPlaybackQualityChange': (event) => this.onPlaybackQualityChange(event),
                'onError': (event) => this.onPlayerError(event)
            }
        });

        // Clear loading message after player loads
        setTimeout(() => this.hideLoading(), 1500);
    }

    ensureSinglePlayer() {
        // Remove any duplicate iframes
        const iframes = document.querySelectorAll('iframe[src*="youtube"]');
        if (iframes.length > 1) {
            for (let i = 1; i < iframes.length; i++) {
                iframes[i].remove();
            }
        }
        
        // Ensure the remaining iframe is properly positioned
        const iframe = this.player?.getIframe();
        if (iframe) {
            iframe.style.cssText = `
                width: 100vw !important;
                height: 100vh !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                z-index: 10 !important;
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
                border: none !important;
                margin: 0 !important;
                padding: 0 !important;
            `;
        }
    }

    onPlayerReady(event) {
        console.log('YouTube player ready');
        this.player = event.target;
        this.updatePlayButton();
        this.startProgressUpdate();
        
        // Set initial volume
        this.player.setVolume(70);
        this.updateVolumeSlider(0.7);
        this.updateVolumeButton();

        // Ensure single instance
        this.ensureSinglePlayer();
    }

    fallbackToDirectEmbed() {
        if (!this.videoData?.key) return;

        console.log('Using fallback embed method');
        
        // Remove any existing iframes first
        document.querySelectorAll('iframe[src*="youtube"]').forEach(iframe => iframe.remove());
        
        this.centerOverlay.innerHTML = `
            <iframe 
                style="width: 100vw; height: 100vh; position: absolute; top: 0; left: 0; z-index: 10; border: none;"
                src="https://www.youtube.com/embed/${this.videoData.key}?autoplay=1&controls=0&rel=0&showinfo=0&modestbranding=1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
            </iframe>
        `;
        this.hideLoading();
    }

    onPlayerStateChange(event) {
        console.log('Player state changed:', event.data);
        
        switch (event.data) {
            case YT.PlayerState.PLAYING:
                this.isPlaying = true;
                this.updatePlayButton();
                break;
            case YT.PlayerState.PAUSED:
                this.isPlaying = false;
                this.updatePlayButton();
                break;
            case YT.PlayerState.ENDED:
                this.isPlaying = false;
                this.updatePlayButton();
                break;
            case YT.PlayerState.BUFFERING:
                console.log('Video buffering...');
                break;
            case YT.PlayerState.CUED:
                console.log('Video cued');
                break;
        }
    }

    onPlaybackQualityChange(event) {
        console.log('Quality changed:', event.data);
    }

    onPlayerError(event) {
        console.error('YouTube player error:', event.data);
        this.showError('Failed to load video. Please try again later.');
    }

    updateBackground() {
        const bgImage = this.videoData.backdrop_path || this.videoData.poster_path;
        if (bgImage) {
            const imageUrl = `https://image.tmdb.org/t/p/w1280${bgImage}`;
            document.querySelector('.background-image').style.backgroundImage = `url('${imageUrl}')`;
        }
    }

    getMovieInfo() {
        const year = this.videoData.release_date ? this.videoData.release_date.split('-')[0] : '2024';
        const runtime = this.videoData.runtime ? `${Math.floor(this.videoData.runtime / 60)}h ${this.videoData.runtime % 60}m` : '';
        const rating = this.videoData.vote_average ? `${Math.round(this.videoData.vote_average * 10)}% Match` : '';
        
        return [year, runtime, rating].filter(Boolean).join(' • ');
    }

    showLoading() {
        const existingLoading = document.getElementById('loadingMessage');
        if (existingLoading) {
            existingLoading.remove();
        }

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-message';
        loadingDiv.id = 'loadingMessage';
        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading Video...</div>
        `;
        document.body.appendChild(loadingDiv);
    }

    hideLoading() {
        const loadingMessage = document.getElementById('loadingMessage');
        if (loadingMessage) {
            loadingMessage.remove();
        }
    }

    showError(message) {
        this.hideLoading();
        this.centerOverlay.innerHTML = `
            <div style="text-align: center; color: #ff4444; padding: 20px;">
                <h2>Error</h2>
                <p>${message}</p>
                <button onclick="window.history.back()" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: #00f0ff;
                    color: black;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                ">Go Back</button>
            </div>
        `;
    }

    fallbackToDirectEmbed() {
        if (!this.videoData?.key) return;

        console.log('Using fallback embed method');
        this.centerOverlay.innerHTML = `
            <iframe 
                style="width: 100vw; height: 100vh; position: fixed; top: 0; left: 0; z-index: 10; border: none;"
                src="https://www.youtube.com/embed/${this.videoData.key}?autoplay=1&controls=0&rel=0&showinfo=0&modestbranding=1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
            </iframe>
        `;
        this.hideLoading();
    }

    togglePlay() {
        if (!this.player) return;

        if (this.isPlaying) {
            this.player.pauseVideo();
        } else {
            this.player.playVideo();
        }
    }

    updatePlayButton() {
        if (this.playButton) {
            const icon = this.playButton.querySelector('.material-symbols-outlined');
            icon.textContent = this.isPlaying ? 'pause_circle' : 'play_circle';
        }
    }

    seek(seconds) {
        if (!this.player) return;

        const currentTime = this.player.getCurrentTime();
        const newTime = Math.max(0, Math.min(currentTime + seconds, this.player.getDuration()));
        this.player.seekTo(newTime, true);
    }

    seekTo(event) {
        if (!this.player) return;

        const progressContainer = this.progressContainer;
        const rect = progressContainer.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * this.player.getDuration();
        
        this.player.seekTo(newTime, true);
    }

    setVolume(event) {
        if (!this.player) return;

        const volumeSlider = this.volumeSlider;
        const rect = volumeSlider.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        
        this.player.setVolume(percentage * 100);
        this.updateVolumeSlider(percentage);
    }

    toggleMute() {
        if (!this.player) return;

        const wasMuted = this.isMuted;
        
        if (wasMuted || this.player.getVolume() === 0) {
            // Unmute and restore previous volume
            this.player.unMute();
            this.player.setVolume(this.previousVolume || 70);
            this.isMuted = false;
        } else {
            // Mute and remember current volume
            this.previousVolume = this.player.getVolume();
            this.player.mute();
            this.isMuted = true;
        }
        
        this.updateVolumeButton();
        this.updateVolumeSlider(this.isMuted ? 0 : (this.previousVolume || 70) / 100);
    }

    startProgressUpdate() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }

        this.progressInterval = setInterval(() => {
            this.updateProgress();
        }, 100);
    }

    updateProgress() {
        if (!this.player || !this.player.getDuration) return;

        const currentTime = this.player.getCurrentTime();
        const duration = this.player.getDuration();
        const percentage = (currentTime / duration) * 100;

        // Update progress bar
        if (this.progressPlayed) {
            this.progressPlayed.style.width = `${percentage}%`;
        }

        // Update time display
        if (this.currentTimeEl) {
            this.currentTimeEl.textContent = this.formatTime(currentTime);
        }
        if (this.durationEl) {
            this.durationEl.textContent = this.formatTime(duration);
        }

        // Update volume button if needed
        this.updateVolumeButton();
    }

    updateVolumeSlider(percentage) {
        if (this.volumeLevel) {
            this.volumeLevel.style.width = `${percentage * 100}%`;
        }
    }

    updateVolumeButton() {
        if (!this.player || !this.volumeButton) return;

        const icon = this.volumeButton.querySelector('.material-symbols-outlined');
        const volume = this.player.getVolume();
        const isCurrentlyMuted = this.player.isMuted();

        if (this.isMuted || isCurrentlyMuted || volume === 0) {
            icon.textContent = 'volume_off';
        } else if (volume < 50) {
            icon.textContent = 'volume_down';
        } else {
            icon.textContent = 'volume_up';
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            if (this.fullscreenButton) {
                const icon = this.fullscreenButton.querySelector('.material-symbols-outlined');
                icon.textContent = 'fullscreen_exit';
            }
        } else {
            document.exitFullscreen();
            if (this.fullscreenButton) {
                const icon = this.fullscreenButton.querySelector('.material-symbols-outlined');
                icon.textContent = 'fullscreen';
            }
        }
    }

    handleKeyPress(event) {
        switch (event.key) {
            case ' ':
                event.preventDefault();
                this.togglePlay();
                break;
            case 'ArrowLeft':
                this.seek(-10);
                break;
            case 'ArrowRight':
                this.seek(10);
                break;
            case 'ArrowUp':
                event.preventDefault();
                // Increase volume
                break;
            case 'ArrowDown':
                event.preventDefault();
                // Decrease volume
                break;
            case 'f':
                this.toggleFullscreen();
                break;
            case 'Escape':
                this.goBack();
                break;
        }
    }

    showControls() {
        document.body.classList.remove('hide-controls');
        this.startHideControlsTimer();
    }

    hideControls() {
        document.body.classList.add('hide-controls');
    }

    startHideControlsTimer() {
        this.cancelHideTimer();
        this.hideTimer = setTimeout(() => {
            this.hideControls();
        }, 3000);
    }

    cancelHideTimer() {
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
    }

    goBack() {
        window.location.href = 'home.html';
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// Global function for YouTube API
function onYouTubeIframeAPIReady() {
    if (window.videoPlayer) {
        window.videoPlayer.onYouTubeIframeAPIReady();
    }
}

// Initialize video player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.videoPlayer = new VideoPlayer();
});