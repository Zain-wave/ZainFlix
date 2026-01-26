// ZainFlix Home Page - API Integration
import { API_CONFIG } from '../services/api.js';
import { MyListService } from '../services/mylist.service.js';

class ZainFlixAPI {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.accessToken = API_CONFIG.ACCESS_TOKEN;
        this.imageBaseURL = 'https://image.tmdb.org/t/p/w500';
        this.heroImageBaseURL = 'https://image.tmdb.org/t/p/w1280';
    }

    async fetchTrending() {
        try {
            const response = await fetch(`${this.baseURL}/trending/all/week`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            const data = await response.json();
            return data.results;
        } catch (error) {
            console.error('Error fetching trending content:', error);
            return [];
        }
    }

    async fetchMovies() {
        try {
            const response = await fetch(`${this.baseURL}/movie/popular`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            const data = await response.json();
            return data.results;
        } catch (error) {
            console.error('Error fetching movies:', error);
            return [];
        }
    }

    async fetchTVShows() {
        try {
            const response = await fetch(`${this.baseURL}/tv/popular`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            const data = await response.json();
            return data.results;
        } catch (error) {
            console.error('Error fetching TV shows:', error);
            return [];
        }
    }

    async fetchSciFiContent() {
        try {
            const response = await fetch(`${this.baseURL}/discover/movie?with_genres=878`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            const data = await response.json();
            return data.results;
        } catch (error) {
            console.error('Error fetching sci-fi content:', error);
            return [];
        }
    }

    async fetchNewReleases() {
        try {
            const response = await fetch(`${this.baseURL}/movie/now_playing`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            const data = await response.json();
            return data.results;
        } catch (error) {
            console.error('Error fetching new releases:', error);
            return [];
        }
    }
}

class ContentRenderer {
    constructor(api) {
        this.api = api;
    }

    async updateHeroSection(content) {
        if (!content || content.length === 0) return;

        const heroContent = content[0];
        const heroSection = document.querySelector('.hero-section');
        const heroBg = document.querySelector('.hero-bg');
        const heroTitle = document.querySelector('.hero-title');
        const heroDescription = document.querySelector('.hero-description');
        const heroMeta = document.querySelector('.hero-meta');

        // Update hero background
        if (heroContent.backdrop_path) {
            heroBg.style.backgroundImage = `url('${this.api.heroImageBaseURL}${heroContent.backdrop_path}')`;
        }

        // Update hero title
        const title = heroContent.title || heroContent.name || 'Unknown Title';
        heroTitle.innerHTML = title.replace(/:/g, ':<br />');

        // Update hero description
        heroDescription.textContent = heroContent.overview || 'No description available.';

        // Update hero metadata
        const year = heroContent.release_date ? heroContent.release_date.split('-')[0] : 
                    heroContent.first_air_date ? heroContent.first_air_date.split('-')[0] : '2024';
        const rating = heroContent.vote_average ? Math.round(heroContent.vote_average * 10) : 85;
        const mediaType = heroContent.media_type === 'tv' ? 'TV Series' : 'Movie';

        heroMeta.innerHTML = `
            <span class="hero-match">${rating}% Match</span>
            <span>${year}</span>
            <span class="hero-rating">${mediaType === 'TV Series' ? 'TV-MA' : 'R'}</span>
            <span>${mediaType === 'TV Series' ? '1 Season' : '2h 30min'}</span>
            <span class="hero-quality">
                <span class="material-symbols-outlined">hd</span> HD
            </span>
        `;

        // Setup hero play button
        this.setupHeroPlayButton(heroContent);
    }

    async setupHeroPlayButton(heroContent) {
        const heroPlayBtn = document.querySelector('.btn-play');
        if (!heroPlayBtn) return;

        // Fetch video for hero content
        try {
            const movieVideos = await this.fetchMovieVideos(heroContent.id);
            const bestVideo = this.getBestVideo(movieVideos.results);
            
            // Store video data for the play button
            heroPlayBtn.dataset.movieId = heroContent.id;
            heroPlayBtn.dataset.hasVideo = bestVideo ? 'true' : 'false';
            
            // Remove existing listener and add new one
            const newPlayBtn = heroPlayBtn.cloneNode(true);
            heroPlayBtn.parentNode.replaceChild(newPlayBtn, heroPlayBtn);
            
            newPlayBtn.addEventListener('click', () => {
                if (bestVideo) {
                    const videoData = {
                        ...heroContent,
                        ...bestVideo,
                        key: bestVideo.key
                    };
                    this.openVideoPlayer(videoData);
                } else {
                    this.showVideoUnavailable();
                }
            });

        } catch (error) {
            console.error('Error setting up hero play button:', error);
            heroPlayBtn.addEventListener('click', () => {
                this.showVideoUnavailable();
            });
        }

        // Setup My List button for hero
        this.setupHeroMyListButton(heroContent);
    }

    setupHeroMyListButton(heroContent) {
        const heroListBtn = document.querySelector('.btn-list');
        if (!heroListBtn) return;

        // Check if movie is already in list
        const isInList = this.myListService.isInMyList(heroContent.id);
        this.myListService.updateButtonState(heroListBtn, isInList);

        // Remove existing listener and add new one
        const newListBtn = heroListBtn.cloneNode(true);
        heroListBtn.parentNode.replaceChild(newListBtn, heroListBtn);

        newListBtn.addEventListener('click', () => {
            const result = this.myListService.toggleMyList(heroContent);
            
            if (result === 'added') {
                this.myListService.showNotification(`${heroContent.title || heroContent.name} added to My List`);
                this.myListService.updateButtonState(newListBtn, true);
            } else if (result === 'removed') {
                this.myListService.showNotification(`${heroContent.title || heroContent.name} removed from My List`);
                this.myListService.updateButtonState(newListBtn, false);
            } else {
                this.myListService.showNotification('Error updating My List', 'error');
            }
        });
    }

    createLandscapeCard(item, index = 0) {
        const title = item.title || item.name || 'Unknown Title';
        const genres = this.getGenres(item);
        
        // Simple fallback for images
        const imagePath = item.backdrop_path || item.poster_path;
        const imageSrc = imagePath ? `${this.api.imageBaseURL}${imagePath}` : '';

        // Use existing card styling from movie.service.js
        const cardClasses = ["card-magenta", "card-cyan", "card-magenta", "card-cyan"];
        const labels = ["New Season", "Trending", "Original", "Anime"];
        const labelClasses = ["label-magenta", "label-cyan", "label-magenta", "label-cyan"];

        return `
            <div class="card-landscape" data-movie-id="${item.id}" onclick="window.movieModal.openModal(${item.id})">
                <div class="card-image-landscape">
                    <div class="card-bg" style="background-image: url('${imageSrc}')" 
                         onerror="this.style.backgroundImage='url(https://via.placeholder.com/300x169/1f2937/ffffff?text=No+Image)'"></div>
                    <div class="card-overlay"></div>
                    ${item.vote_average > 7.5 ? '<div class="card-badge badge-hd">HD</div>' : ''}
                </div>
                <div class="card-info">
                    <h3 class="card-title">${title}</h3>
                    <p class="card-genre">${genres}</p>
                </div>
            </div>
        `;
    }

    createPortraitCard(item, index = 0) {
        const title = item.title || item.name || 'Unknown Title';
        
        // Simple fallback for images
        const imagePath = item.poster_path || item.backdrop_path;
        const imageSrc = imagePath ? `${this.api.imageBaseURL}${imagePath}` : '';

        // Use existing card styling from movie.service.js
        const cardClasses = ["card-magenta", "card-cyan", "card-magenta", "card-cyan"];
        const labels = ["New Season", "Trending", "Original", "Anime"];
        const labelClasses = ["label-magenta", "label-cyan", "label-magenta", "label-cyan"];

        return `
            <div class="card-portrait" data-movie-id="${item.id}" onclick="window.movieModal.openModal(${item.id})">
                <div class="card-image-portrait">
                    <div class="card-bg" style="background-image: url('${imageSrc}')"
                         onerror="this.style.backgroundImage='url(https://via.placeholder.com/200x300/1f2937/ffffff?text=No+Image)'"></div>
                    <div class="portrait-gradient"></div>
                    <div class="portrait-overlay-title">
                        <h3 class="portrait-title">${title}</h3>
                    </div>
                </div>
            </div>
        `;
    }

    getGenres(item) {
        const genreMap = {
            28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
            80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
            14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
            9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
            53: 'Thriller', 10752: 'War', 37: 'Western'
        };

        if (item.genre_ids && item.genre_ids.length > 0) {
            return item.genre_ids.slice(0, 3).map(id => genreMap[id] || 'Unknown').join(' • ');
        }
        
        return 'Action • Sci-Fi • Thriller';
    }

    updateCarousel(sectionClass, items, cardType = 'landscape') {
        const carousel = document.querySelector(`.${sectionClass} .carousel-inner`);
        if (!carousel) return;

        const cards = items.slice(0, 10).map(item => {
            return cardType === 'portrait' ? this.createPortraitCard(item) : this.createLandscapeCard(item);
        }).join('');

        carousel.innerHTML = cards;
    }

    async fetchMovieVideos(movieId) {
        try {
            const response = await fetch(`${this.api.baseURL}/movie/${movieId}/videos`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${this.api.accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                return { results: [] };
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching movie videos:', error);
            return { results: [] };
        }
    }

    getBestVideo(videos) {
        if (!videos || videos.length === 0) return null;

        // Priority order for video types
        const videoTypePriority = ['Trailer', 'Teaser', 'Clip', 'Featurette'];
        const sitePriority = ['YouTube', 'Vimeo'];

        // Filter for videos that have a key (can be embedded)
        const validVideos = videos.filter(video => video.key && video.site);

        if (validVideos.length === 0) return null;

        // Sort by type and site priority
        const sortedVideos = validVideos.sort((a, b) => {
            const typeA = videoTypePriority.indexOf(a.type);
            const typeB = videoTypePriority.indexOf(b.type);
            
            if (typeA !== typeB) {
                return (typeA === -1 ? 999 : typeA) - (typeB === -1 ? 999 : typeB);
            }
            
            const siteA = sitePriority.indexOf(a.site);
            const siteB = sitePriority.indexOf(b.site);
            
            return (siteA === -1 ? 999 : siteA) - (siteB === -1 ? 999 : siteB);
        });

        return sortedVideos[0];
    }

    openVideoPlayer(videoData) {
        const encodedData = encodeURIComponent(JSON.stringify(videoData));
        const playerUrl = `video-player.html?data=${encodedData}`;
        window.open(playerUrl, '_blank');
    }

    showVideoUnavailable() {
        const notification = document.createElement('div');
        notification.className = 'profile-notification show';
        notification.style.backgroundColor = 'rgba(255, 59, 48, 0.9)';
        notification.style.color = 'white';
        notification.textContent = 'No video available for this title';
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
}

// Import existing movie service functions
import { getPopularMovies, createMovieCard, renderMovies } from '../services/movie.service.js';

class ZainFlixHome {
    constructor() {
        this.api = new ZainFlixAPI();
        this.renderer = new ContentRenderer(this.api);
        this.myListService = new MyListService();
        this.init();
    }

    async init() {
        try {
            // Show loading state
            this.showLoadingState();

            // Use existing movie service for popular movies
            const popularMoviesData = await getPopularMovies();
            const popularMovies = popularMoviesData.results || [];

            // Fetch additional content using our API
            const [trending, scifi, newReleases] = await Promise.all([
                this.api.fetchTrending(),
                this.api.fetchSciFiContent(),
                this.api.fetchNewReleases()
            ]);

            // Update hero section with trending content
            this.renderer.updateHeroSection(trending);

            // Update carousels
            this.renderer.updateCarousel('trending', trending, 'landscape');
            this.renderer.updateCarousel('scifi', scifi, 'portrait');
            this.renderer.updateCarousel('new-releases', newReleases, 'landscape');

            // Use existing movie service for specific sections
            this.updateTrendingSection(popularMovies);

            // Add click handlers to cards
            this.addCardClickHandlers();

            // Hide loading state
            this.hideLoadingState();

        } catch (error) {
            console.error('Error initializing ZainFlix home:', error);
            this.showErrorState();
        }
    }

    updateTrendingSection(movies) {
        // Use existing createMovieCard function from movie.service.js
        const trendingCarousel = document.querySelector('.section:nth-child(1) .carousel-inner');
        if (trendingCarousel && movies.length > 0) {
            const movieCards = movies
                .slice(0, 6)
                .map((movie, index) => this.convertToLandscapeCard(movie, index))
                .join('');
            trendingCarousel.innerHTML = movieCards;
        }
    }

    convertToLandscapeCard(movie, index) {
        // Convert existing movie card to landscape format
        const title = movie.title || movie.name || 'Unknown Title';
        const genres = this.renderer.getGenres(movie);
        
        // Simple fallback for images
        const imagePath = movie.backdrop_path || movie.poster_path;
        const imageSrc = imagePath ? `${this.api.imageBaseURL}${imagePath}` : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQO5kCepNdhZvDKJtmPAIWnloSdTal7N1CQaA&s";

        return `
            <div class="card-landscape" data-movie-id="${movie.id}" onclick="window.movieModal.openModal(${movie.id})">
                <div class="card-image-landscape">
                    <div class="card-bg" style="background-image: url('${imageSrc}')"
                         onerror="this.style.backgroundImage='url(https://via.placeholder.com/300x169/1f2937/ffffff?text=No+Image)'"></div>
                    <div class="card-overlay"></div>
                    ${movie.vote_average > 7.5 ? '<div class="card-badge badge-hd">HD</div>' : ''}
                </div>
                <div class="card-info">
                    <h3 class="card-title">${title}</h3>
                    <p class="card-genre">${genres}</p>
                </div>
            </div>
        `;
    }

    showLoadingState() {
        const carousels = document.querySelectorAll('.carousel-inner');
        carousels.forEach(carousel => {
            carousel.innerHTML = '<div style="text-align: center; padding: 2rem; color: #9ca3af;">Loading content...</div>';
        });
    }

    hideLoadingState() {
        // Loading state is hidden when content is rendered
    }

    showErrorState() {
        const carousels = document.querySelectorAll('.carousel-inner');
        carousels.forEach(carousel => {
            carousel.innerHTML = '<div style="text-align: center; padding: 2rem; color: #ef4444;">Failed to load content. Please try again later.</div>';
        });
    }

    addCardClickHandlers() {
        const cards = document.querySelectorAll('.card-landscape, .card-portrait');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const title = card.querySelector('.card-title, .portrait-title').textContent;
                console.log(`Clicked on: ${title}`);
                // Add navigation or modal functionality here
            });
        });
    }
}
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const zainFlixHome = new ZainFlixHome();
    let profileManager = null;
    
    // Wait for ProfileManager to be available
    const initProfileManager = () => {
        if (window.ProfileManager) {
            profileManager = new window.ProfileManager();
            window.profileManager = profileManager; // Make globally accessible
            console.log('ProfileManager initialized in home.js');
        } else {
            setTimeout(initProfileManager, 100);
        }
    };
    
    initProfileManager();
    
    const movieModal = new MovieModal();

    // Make modal globally accessible for card clicks
    window.movieModal = movieModal;
});

// Add smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Add search functionality
const searchButton = document.querySelector('.icon-button');
if (searchButton) {
    searchButton.addEventListener('click', () => {
        console.log('Search clicked');
        // Add search modal or navigation here
    });
}

// Movie Modal functionality
class MovieModal {
    constructor() {
        this.modal = document.getElementById('movieModal');
        this.closeBtn = document.getElementById('closeModal');
        this.currentMovie = null;
        this.myListService = new MyListService();
        this.init();
    }

    init() {
        // Close modal events
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeModal());
        }

        // Close on backdrop click
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeModal();
                }
            });
        }

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal?.classList.contains('show')) {
                this.closeModal();
            }
        });

        // Play button events
        this.setupPlayButtons();
        
        // My List button events
        this.setupMyListButton();
    }

    setupPlayButtons() {
        // Hero section play button
        const heroPlayBtn = this.modal?.querySelector('.modal-play-btn');
        if (heroPlayBtn) {
            heroPlayBtn.addEventListener('click', () => this.playVideo());
        }

        // Action bar play button
        const actionBarPlayBtn = this.modal?.querySelector('.modal-btn-play');
        if (actionBarPlayBtn) {
            actionBarPlayBtn.addEventListener('click', () => this.playVideo());
        }
    }

    setupMyListButton() {
        const myListBtn = this.modal?.querySelector('.modal-icon-btn.primary[aria-label="Add to my list"]');
        if (!myListBtn) return;

        // Remove existing listener and add new one
        const newListBtn = myListBtn.cloneNode(true);
        myListBtn.parentNode.replaceChild(newListBtn, myListBtn);

        newListBtn.addEventListener('click', () => {
            if (!this.currentMovie) return;

            const result = this.myListService.toggleMyList(this.currentMovie);
            
            if (result === 'added') {
                this.myListService.showNotification(`${this.currentMovie.title || this.currentMovie.name} added to My List`);
                this.updateMyListButton(newListBtn, true);
            } else if (result === 'removed') {
                this.myListService.showNotification(`${this.currentMovie.title || this.currentMovie.name} removed from My List`);
                this.updateMyListButton(newListBtn, false);
            } else {
                this.myListService.showNotification('Error updating My List', 'error');
            }
        });
    }

    updateMyListButton(button, isInList) {
        if (!button) return;

        const icon = button.querySelector('.material-symbols-outlined');
        const tooltip = button.querySelector('.tooltip');
        
        if (isInList) {
            icon.textContent = 'check';
            if (tooltip) tooltip.textContent = 'Remove from List';
            button.classList.add('in-list');
        } else {
            icon.textContent = 'add';
            if (tooltip) tooltip.textContent = 'Add to List';
            button.classList.remove('in-list');
        }
    }

    playVideo() {
        if (!this.currentVideo) {
            this.showVideoUnavailable();
            return;
        }

        // Combine movie data with video data
        const videoData = {
            ...this.currentMovie,
            ...this.currentVideo,
            key: this.currentVideo.key
        };

        // Open video player with movie and video data
        this.openVideoPlayer(videoData);
    }

    openVideoPlayer(videoData) {
        const encodedData = encodeURIComponent(JSON.stringify(videoData));
        const playerUrl = `video-player.html?data=${encodedData}`;
        window.open(playerUrl, '_blank');
    }

    showVideoUnavailable() {
        const notification = document.createElement('div');
        notification.className = 'profile-notification show';
        notification.style.backgroundColor = 'rgba(255, 59, 48, 0.9)';
        notification.style.color = 'white';
        notification.textContent = 'No video available for this title';
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

    async openModal(movieId) {
        try {
            // Show loading state
            this.showLoadingState();
            this.modal.classList.add('show');

            // Fetch movie details and videos in parallel
            const [movieDetails, movieVideos] = await Promise.all([
                this.fetchMovieDetails(movieId),
                this.fetchMovieVideos(movieId)
            ]);

            this.currentMovie = movieDetails;
            this.currentVideo = this.getBestVideo(movieVideos.results);

            // Populate modal with data
            this.populateModal(movieDetails);

        } catch (error) {
            console.error('Error loading movie details:', error);
            this.showErrorState();
        }
    }

    async fetchMovieDetails(movieId) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/movie/${movieId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${API_CONFIG.ACCESS_TOKEN}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch movie details');
        }

        return await response.json();
    }

    async fetchMovieVideos(movieId) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/movie/${movieId}/videos`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${API_CONFIG.ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                return { results: [] };
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching movie videos:', error);
            return { results: [] };
        }
    }

    getBestVideo(videos) {
        if (!videos || videos.length === 0) return null;

        // Priority order for video types
        const videoTypePriority = ['Trailer', 'Teaser', 'Clip', 'Featurette'];
        const sitePriority = ['YouTube', 'Vimeo'];

        // Filter for videos that have a key (can be embedded)
        const validVideos = videos.filter(video => video.key && video.site);

        if (validVideos.length === 0) return null;

        // Sort by type and site priority
        const sortedVideos = validVideos.sort((a, b) => {
            const typeA = videoTypePriority.indexOf(a.type);
            const typeB = videoTypePriority.indexOf(b.type);
            
            if (typeA !== typeB) {
                return (typeA === -1 ? 999 : typeA) - (typeB === -1 ? 999 : typeB);
            }
            
            const siteA = sitePriority.indexOf(a.site);
            const siteB = sitePriority.indexOf(b.site);
            
            return (siteA === -1 ? 999 : siteA) - (siteB === -1 ? 999 : siteB);
        });

        return sortedVideos[0];
    }

    getVideoUrl(video) {
        if (!video) return null;

        switch (video.site) {
            case 'YouTube':
                return `https://www.youtube.com/watch?v=${video.key}`;
            case 'Vimeo':
                return `https://vimeo.com/${video.key}`;
            default:
                return null;
        }
    }

    getEmbedUrl(video) {
        if (!video) return null;

        switch (video.site) {
            case 'YouTube':
                return `https://www.youtube.com/embed/${video.key}?autoplay=1&rel=0`;
            case 'Vimeo':
                return `https://player.vimeo.com/video/${video.key}?autoplay=1`;
            default:
                return null;
        }
    }

    showLoadingState() {
        document.getElementById('modalTitle').textContent = 'Loading...';
        document.getElementById('modalSynopsis').textContent = 'Loading movie details...';
        document.getElementById('modalCast').textContent = 'Loading...';
        document.getElementById('modalDirector').textContent = 'Loading...';
        document.getElementById('modalGenreList').textContent = 'Loading...';
        document.getElementById('modalHeroImage').style.backgroundImage = '';
    }

    showErrorState() {
        document.getElementById('modalTitle').textContent = 'Error Loading Movie';
        document.getElementById('modalSynopsis').textContent = 'Failed to load movie details. Please try again.';
        document.getElementById('modalCast').textContent = 'N/A';
        document.getElementById('modalDirector').textContent = 'N/A';
        document.getElementById('modalGenreList').textContent = 'N/A';
    }

    populateModal(movie) {
        // Title
        document.getElementById('modalTitle').textContent = movie.title || movie.name || 'Unknown Title';

        // Year and duration
        const year = movie.release_date ? movie.release_date.split('-')[0] : '2024';
        document.getElementById('modalYear').textContent = year;
        document.getElementById('modalDuration').textContent = movie.runtime ? 
            `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '2h 14m';

        // Rating
        document.getElementById('modalRating').textContent = this.getRating(movie);
        document.getElementById('modalMaturityBadge').textContent = this.getRating(movie);

        // Genres
        const genres = movie.genres?.map(g => g.name).join(' / ') || this.renderer.getGenres(movie);
        document.getElementById('modalGenres').textContent = genres;
        document.getElementById('modalGenreList').textContent = genres;

        // Synopsis
        document.getElementById('modalSynopsis').textContent = movie.overview || 'No synopsis available.';

        // Hero image with fallback
        const backdropPath = movie.backdrop_path || movie.poster_path;
        if (backdropPath) {
            const imageUrl = `https://image.tmdb.org/t/p/w1280${backdropPath}`;
            document.getElementById('modalHeroImage').style.backgroundImage = `url('${imageUrl}')`;
        }

        // Cast (simplified - would need additional API call for full cast)
        document.getElementById('modalCast').innerHTML = 'Cast information not available';

        // Director (simplified - would need additional API call for full crew)
        document.getElementById('modalDirector').textContent = 'Director information not available';

        // Maturity description
        document.getElementById('modalMaturityDesc').textContent = this.getMaturityDescription(movie);

        // Update play buttons based on video availability
        this.updatePlayButtons();

        // Update My List button state
        this.updateModalMyListButton(movie);
    }

    updateModalMyListButton(movie) {
        const myListBtn = this.modal?.querySelector('.modal-icon-btn.primary[aria-label="Add to my list"]');
        if (!myListBtn) return;

        const isInList = this.myListService.isInMyList(movie.id);
        this.updateMyListButton(myListBtn, isInList);
    }

    updatePlayButtons() {
        const heroPlayBtn = this.modal?.querySelector('.modal-play-btn');
        const actionBarPlayBtn = this.modal?.querySelector('.modal-btn-play');
        
        if (this.currentVideo) {
            // Video available - enable play buttons
            heroPlayBtn?.classList.remove('disabled');
            actionBarPlayBtn?.classList.remove('disabled');
            
            // Update tooltip or text to indicate trailer availability
            if (this.currentVideo.type === 'Trailer') {
                actionBarPlayBtn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span> Play Trailer';
            } else {
                actionBarPlayBtn.innerHTML = `<span class="material-symbols-outlined">play_arrow</span> Play ${this.currentVideo.type}`;
            }
        } else {
            // No video available - disable play buttons or show alternative
            heroPlayBtn?.classList.add('disabled');
            actionBarPlayBtn?.classList.add('disabled');
            actionBarPlayBtn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span> No Video Available';
        }
    }

    getRating(movie) {
        if (movie.adult) return 'TV-MA';
        if (movie.vote_average > 7) return 'TV-14';
        return 'PG-13';
    }

    getMaturityDescription(movie) {
        if (movie.adult) return 'Language, Violence, Adult Content';
        if (movie.vote_average > 7) return 'Language, Violence, Adult Themes';
        return 'Language, Some Violence';
    }

    closeModal() {
        this.modal.classList.remove('show');
        this.currentMovie = null;
    }
}