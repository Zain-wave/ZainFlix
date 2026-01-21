// ZainFlix Modal Component - Reusable Modal System
export class Modal {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        this.closeBtn = this.modal?.querySelector('.close-btn');
        this.currentData = null;
        this.init();
    }

    init() {
        if (!this.modal) return;

        // Close modal events
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }

        // Close on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.close();
            }
        });
    }

    show(data = null) {
        this.currentData = data;
        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        if (data) {
            this.populateModal(data);
        }
    }

    close() {
        this.modal.classList.remove('show');
        document.body.style.overflow = '';
        this.currentData = null;
    }

    populateModal(data) {
        // Override in subclasses
        console.log('Populating modal with data:', data);
    }

    showLoading() {
        // Show loading state in modal
        const loadingElements = this.modal.querySelectorAll('[data-loading]');
        loadingElements.forEach(el => {
            el.textContent = 'Loading...';
        });
    }

    showError(message) {
        // Show error state in modal
        const errorElements = this.modal.querySelectorAll('[data-error]');
        errorElements.forEach(el => {
            el.textContent = message;
        });
    }

    updateContent(key, value) {
        const element = this.modal.querySelector(`[data-content="${key}"]`);
        if (element) {
            element.textContent = value;
        }
    }

    updateImage(key, url) {
        const element = this.modal.querySelector(`[data-image="${key}"]`);
        if (element) {
            element.style.backgroundImage = `url('${url}')`;
        }
    }
}

// Movie Modal - Extends base Modal
export class MovieModal extends Modal {
    constructor() {
        super('movieModal');
        this.myListService = null;
    }

    async showMovie(movieId, myListService) {
        this.myListService = myListService;
        
        try {
            this.showLoading();
            this.show();

            // Fetch movie details and videos in parallel
            const [movieDetails, movieVideos] = await Promise.all([
                this.fetchMovieDetails(movieId),
                this.fetchMovieVideos(movieId)
            ]);

            this.currentData = {
                movie: movieDetails,
                video: this.getBestVideo(movieVideos.results)
            };

            this.populateModal(this.currentData);
            this.setupPlayButtons();
            this.setupMyListButton();

        } catch (error) {
            console.error('Error loading movie details:', error);
            this.showError('Failed to load movie details. Please try again.');
        }
    }

    populateModal(data) {
        const { movie, video } = data;

        // Title
        this.updateContent('title', movie.title || movie.name || 'Unknown Title');

        // Year and duration
        const year = movie.release_date ? movie.release_date.split('-')[0] : '2024';
        this.updateContent('year', year);
        const duration = movie.runtime ? 
            `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '2h 14m';
        this.updateContent('duration', duration);

        // Rating
        const rating = this.getRating(movie);
        this.updateContent('rating', rating);
        this.updateContent('maturityBadge', rating);

        // Genres
        const genres = movie.genres?.map(g => g.name).join(' / ') || 'Action • Sci-Fi • Thriller';
        this.updateContent('genres', genres);
        this.updateContent('genreList', genres);

        // Synopsis
        this.updateContent('synopsis', movie.overview || 'No synopsis available.');

        // Hero image
        const backdropPath = movie.backdrop_path || movie.poster_path;
        if (backdropPath) {
            const imageUrl = `https://image.tmdb.org/t/p/w1280${backdropPath}`;
            this.updateImage('heroImage', imageUrl);
        }

        // Cast and Director (simplified)
        this.updateContent('cast', 'Cast information not available');
        this.updateContent('director', 'Director information not available');

        // Maturity description
        this.updateContent('maturityDesc', this.getMaturityDescription(movie));

        // Added date for My List
        if (movie.addedAt) {
            const addedDate = new Date(movie.addedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            this.updateContent('addedDate', addedDate);
        }
    }

    setupPlayButtons() {
        const playBtns = this.modal.querySelectorAll('.modal-play-btn, .modal-btn-play');
        
        playBtns.forEach(btn => {
            // Remove existing listeners
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', () => {
                if (this.currentData?.video) {
                    this.playVideo();
                } else {
                    this.showVideoUnavailable();
                }
            });
        });
    }

    setupMyListButton() {
        const myListBtn = this.modal.querySelector('.modal-icon-btn.primary[aria-label="Add to my list"]');
        if (!myListBtn || !this.myListService) return;

        // Update button state
        const isInList = this.myListService.isInMyList(this.currentData.movie.id);
        this.updateMyListButton(myListBtn, isInList);

        // Remove existing listener and add new one
        const newListBtn = myListBtn.cloneNode(true);
        myListBtn.parentNode.replaceChild(newListBtn, myListBtn);

        newListBtn.addEventListener('click', () => {
            if (!this.currentData.movie) return;

            const result = this.myListService.toggleMyList(this.currentData.movie);
            
            if (result === 'added') {
                this.myListService.showNotification(`${this.currentData.movie.title || this.currentData.movie.name} added to My List`);
                this.updateMyListButton(newListBtn, true);
            } else if (result === 'removed') {
                this.myListService.showNotification(`${this.currentData.movie.title || this.currentData.movie.name} removed from My List`);
                this.updateMyListButton(newListBtn, false);
            } else {
                this.myListService.showNotification('Error updating My List', 'error');
            }
        });
    }

    updateMyListButton(button, isInList) {
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
        if (!this.currentData.video) {
            this.showVideoUnavailable();
            return;
        }

        const videoData = {
            ...this.currentData.movie,
            ...this.currentData.video,
            key: this.currentData.video.key
        };

        this.openVideoPlayer(videoData);
    }

    openVideoPlayer(videoData) {
        const encodedData = encodeURIComponent(JSON.stringify(videoData));
        const playerUrl = `../pages/video-player.html?data=${encodedData}`;
        window.open(playerUrl, '_blank');
    }

    showVideoUnavailable() {
        this.myListService?.showNotification('No video available for this title', 'info');
    }

    async fetchMovieDetails(movieId) {
        const API_CONFIG = {
            BASE_URL: "https://api.themoviedb.org/3",
            ACCESS_TOKEN: "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4YTg1YTg3NzNjM2Y2OWIyNDE1OGI0OTYzMzg0MzljOCIsIm5iZiI6MTc2MjU1NDkyNy43MDMsInN1YiI6IjY5MGU3NDJmMjEyZjZjMzc0YmNlN2Q3ZCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.d6isBRoGRcXmfSdXbqvzmCkMqkbrYR1DGBldWT7I9WY"
        };

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
        const API_CONFIG = {
            BASE_URL: "https://api.themoviedb.org/3",
            ACCESS_TOKEN: "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4YTg1YTg3NzNjM2Y2OWIyNDE1OGI0OTYzMzg0MzljOCIsIm5iZiI6MTc2MjU1NDkyNy43MDMsInN1YiI6IjY5MGU3NDJmMjEyZjZjMzc0YmNlN2Q3ZCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.d6isBRoGRcXmfSdXbqvzmCkMqkbrYR1DGBldWT7I9WY"
        };

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

        const videoTypePriority = ['Trailer', 'Teaser', 'Clip', 'Featurette'];
        const sitePriority = ['YouTube', 'Vimeo'];

        const validVideos = videos.filter(video => video.key && video.site);

        if (validVideos.length === 0) return null;

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
}