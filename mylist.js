// ZainFlix My List Page
import { API_CONFIG } from './js/config/api.config.js';
import { MyListService } from './js/services/mylist.service.js';
import { ProfileManager } from './js/components/profile-manager.js';

class MyListPage {
    constructor() {
        this.myListService = new MyListService();
        this.baseURL = API_CONFIG.BASE_URL;
        this.accessToken = API_CONFIG.ACCESS_TOKEN;
        this.imageBaseURL = 'https://image.tmdb.org/t/p/w500';
        this.heroImageBaseURL = 'https://image.tmdb.org/t/p/w1280';
        this.currentView = 'grid';
        this.currentSort = 'recent';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadMyList();
        this.updateHeroStats();
    }

    setupEventListeners() {
        // Shuffle Play
        document.getElementById('shufflePlay')?.addEventListener('click', () => {
            this.shufflePlay();
        });

        // Clear List
        document.getElementById('clearList')?.addEventListener('click', () => {
            this.clearList();
        });

        // Sort Select
        document.getElementById('sortSelect')?.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.renderMyList();
        });

        // View Toggle
        document.getElementById('viewToggle')?.addEventListener('click', () => {
            this.toggleView();
        });

        // Modal setup
        this.setupModal();
    }

    async loadMyList() {
        try {
            const myList = this.myListService.getMyList();
            
            if (myList.length === 0) {
                this.showEmptyState();
                return;
            }

            // Fetch additional details for each movie
            const moviesWithDetails = await Promise.all(
                myList.map(async (movie) => {
                    try {
                        const details = await this.fetchMovieDetails(movie.id);
                        return { ...movie, ...details };
                    } catch (error) {
                        console.error(`Error fetching details for movie ${movie.id}:`, error);
                        return movie;
                    }
                })
            );

            this.myList = moviesWithDetails;
            this.renderMyList();
            this.hideEmptyState();

        } catch (error) {
            console.error('Error loading My List:', error);
            this.showErrorState();
        }
    }

    async fetchMovieDetails(movieId) {
        const response = await fetch(`${this.baseURL}/movie/${movieId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch movie details');
        }

        return await response.json();
    }

    renderMyList() {
        const container = document.getElementById('myListContent');
        if (!container || !this.myList) return;

        let sortedList = this.sortList(this.myList, this.currentSort);
        
        const cards = sortedList.map(movie => this.createMyListCard(movie)).join('');
        container.innerHTML = cards;

        // Add click handlers
        this.addCardClickHandlers();
    }

    sortList(list, sortType) {
        const sorted = [...list];
        
        switch (sortType) {
            case 'alphabetical':
                return sorted.sort((a, b) => {
                    const titleA = (a.title || a.name || '').toLowerCase();
                    const titleB = (b.title || b.name || '').toLowerCase();
                    return titleA.localeCompare(titleB);
                });
                
            case 'rating':
                return sorted.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
                
            case 'year':
                return sorted.sort((a, b) => {
                    const yearA = a.release_date ? parseInt(a.release_date.split('-')[0]) : 0;
                    const yearB = b.release_date ? parseInt(b.release_date.split('-')[0]) : 0;
                    return yearB - yearA;
                });
                
            case 'recent':
            default:
                return sorted.sort((a, b) => {
                    const dateA = a.addedAt ? new Date(a.addedAt) : new Date(0);
                    const dateB = b.addedAt ? new Date(b.addedAt) : new Date(0);
                    return dateB - dateA;
                });
        }
    }

    createMyListCard(movie) {
        const title = movie.title || movie.name || 'Unknown Title';
        const year = movie.release_date ? movie.release_date.split('-')[0] : 'Unknown';
        const rating = movie.vote_average ? Math.round(movie.vote_average * 10) : 0;
        const addedDate = movie.addedAt ? new Date(movie.addedAt).toLocaleDateString() : 'Unknown';
        
        // Image handling
        const imagePath = movie.backdrop_path || movie.poster_path;
        const imageSrc = imagePath ? `${this.imageBaseURL}${imagePath}` : 
                          'https://via.placeholder.com/300x169/1f2937/ffffff?text=No+Image';

        return `
            <div class="mylist-card" data-movie-id="${movie.id}">
                <div class="mylist-card-image" style="background-image: url('${imageSrc}')">
                    <div class="mylist-card-overlay"></div>
                    <div class="mylist-card-play">
                        <span class="material-symbols-outlined">play_arrow</span>
                    </div>
                    <div class="mylist-card-remove" data-movie-id="${movie.id}">
                        <span class="material-symbols-outlined">close</span>
                    </div>
                </div>
                <div class="mylist-card-info">
                    <h3 class="mylist-card-title">${title}</h3>
                    <div class="mylist-card-meta">
                        <span class="mylist-card-year">${year}</span>
                        <span class="mylist-card-rating">${rating}%</span>
                    </div>
                    <div class="mylist-card-added">Added ${addedDate}</div>
                </div>
            </div>
        `;
    }

    addCardClickHandlers() {
        // Card click for modal (but not for play button)
        document.querySelectorAll('.mylist-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't open modal if clicking remove button or play button
                if (e.target.closest('.mylist-card-remove') || e.target.closest('.mylist-card-play')) return;
                
                const movieId = parseInt(card.dataset.movieId);
                this.openModal(movieId);
            });
        });

        // Play button click - direct to video player
        document.querySelectorAll('.mylist-card-play').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = e.target.closest('.mylist-card');
                const movieId = parseInt(card.dataset.movieId);
                this.playDirectly(movieId);
            });
        });

        // Remove button click
        document.querySelectorAll('.mylist-card-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const movieId = parseInt(btn.dataset.movieId);
                this.removeFromList(movieId);
            });
        });
    }

    removeFromList(movieId) {
        const movie = this.myList.find(m => m.id === movieId);
        if (!movie) return;

        const success = this.myListService.removeFromMyList(movieId);
        
        if (success) {
            this.myListService.showNotification(`${movie.title || movie.name} removed from My List`);
            
            // Update local list and re-render
            this.myList = this.myList.filter(m => m.id !== movieId);
            this.renderMyList();
            this.updateHeroStats();
            
            // Show empty state if list is now empty
            if (this.myList.length === 0) {
                this.showEmptyState();
            }
        } else {
            this.myListService.showNotification('Error removing from My List', 'error');
        }
    }

    async playDirectly(movieId) {
        try {
            // Find the movie in our list
            const movie = this.myList.find(m => m.id === movieId);
            if (!movie) {
                this.myListService.showNotification('Movie not found', 'error');
                return;
            }

            // Fetch video for this movie
            const videos = await this.fetchMovieVideos(movieId);
            const bestVideo = this.getBestVideo(videos.results);
            
            if (bestVideo) {
                const videoData = {
                    ...movie,
                    ...bestVideo,
                    key: bestVideo.key
                };
                this.openVideoPlayer(videoData);
            } else {
                this.myListService.showNotification('No video available for this title', 'info');
            }
        } catch (error) {
            console.error('Error playing video directly:', error);
            this.myListService.showNotification('Error loading video', 'error');
        }
    }

    shufflePlay() {
        if (!this.myList || this.myList.length === 0) {
            this.myListService.showNotification('No items in your list to shuffle', 'info');
            return;
        }

        // Pick a random movie
        const randomMovie = this.myList[Math.floor(Math.random() * this.myList.length)];
        
        // Try to get video for this movie
        this.fetchMovieVideos(randomMovie.id).then(videos => {
            const bestVideo = this.getBestVideo(videos.results);
            
            if (bestVideo) {
                const videoData = {
                    ...randomMovie,
                    ...bestVideo,
                    key: bestVideo.key
                };
                this.openVideoPlayer(videoData);
            } else {
                this.myListService.showNotification('No video available for this title', 'info');
            }
        }).catch(error => {
            console.error('Error fetching video for shuffle play:', error);
            this.myListService.showNotification('Error loading video', 'error');
        });
    }

    clearList() {
        if (!this.myList || this.myList.length === 0) {
            this.myListService.showNotification('Your list is already empty', 'info');
            return;
        }

        if (confirm(`Are you sure you want to clear all ${this.myList.length} items from your list?`)) {
            const success = this.myListService.clearUserList();
            
            if (success) {
                this.myListService.showNotification('My List cleared successfully');
                this.myList = [];
                this.showEmptyState();
                this.updateHeroStats();
            } else {
                this.myListService.showNotification('Error clearing My List', 'error');
            }
        }
    }

    toggleView() {
        const carousel = document.querySelector('.mylist-carousel');
        const toggleBtn = document.getElementById('viewToggle');
        const icon = toggleBtn.querySelector('.material-symbols-outlined');
        
        if (this.currentView === 'grid') {
            this.currentView = 'list';
            carousel.classList.add('list-view');
            icon.textContent = 'view_list';
        } else {
            this.currentView = 'grid';
            carousel.classList.remove('list-view');
            icon.textContent = 'grid_view';
        }
    }

    updateHeroStats() {
        const count = this.myList ? this.myList.length : 0;
        const listCountEl = document.getElementById('listCount');
        const lastUpdatedEl = document.getElementById('lastUpdated');
        
        if (listCountEl) {
            listCountEl.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
        }
        
        if (lastUpdatedEl) {
            lastUpdatedEl.textContent = 'Updated just now';
        }
    }

    showEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const content = document.querySelector('.mylist-section');
        
        if (emptyState) emptyState.style.display = 'block';
        if (content) content.style.display = 'none';
    }

    hideEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const content = document.querySelector('.mylist-section');
        
        if (emptyState) emptyState.style.display = 'none';
        if (content) content.style.display = 'block';
    }

    showErrorState() {
        const container = document.getElementById('myListContent');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #ef4444;">
                    <h3>Error loading My List</h3>
                    <p>Please try again later.</p>
                </div>
            `;
        }
    }

    // Video player methods (reused from home.js)
    async fetchMovieVideos(movieId) {
        try {
            const response = await fetch(`${this.baseURL}/movie/${movieId}/videos`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
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

    openVideoPlayer(videoData) {
        const encodedData = encodeURIComponent(JSON.stringify(videoData));
        const playerUrl = `video-player.html?data=${encodedData}`;
        window.open(playerUrl, '_blank');
    }

    // Modal methods (simplified version)
    setupModal() {
        const modal = document.getElementById('movieModal');
        const closeBtn = document.getElementById('closeModal');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal?.classList.contains('show')) {
                this.closeModal();
            }
        });
    }

    async openModal(movieId) {
        const modal = document.getElementById('movieModal');
        if (!modal) return;

        try {
            modal.classList.add('show');
            
            const movieDetails = await this.fetchMovieDetails(movieId);
            const movieVideos = await this.fetchMovieVideos(movieId);
            const bestVideo = this.getBestVideo(movieVideos.results);
            
            // Get movie from our list to show added date
            const myListMovie = this.myList.find(m => m.id === movieId);
            
            this.populateModal(movieDetails, myListMovie, bestVideo);
            
        } catch (error) {
            console.error('Error loading movie details:', error);
            this.closeModal();
        }
    }

    populateModal(movie, myListMovie, video) {
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
        const genres = movie.genres?.map(g => g.name).join(' / ') || 'Action • Sci-Fi • Thriller';
        document.getElementById('modalGenres').textContent = genres;
        document.getElementById('modalGenreList').textContent = genres;

        // Synopsis
        document.getElementById('modalSynopsis').textContent = movie.overview || 'No synopsis available.';

        // Added date (from My List)
        if (myListMovie && myListMovie.addedAt) {
            const addedDate = new Date(myListMovie.addedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            document.getElementById('modalAddedDate').textContent = addedDate;
        }

        // Hero image
        const backdropPath = movie.backdrop_path || movie.poster_path;
        if (backdropPath) {
            const imageUrl = `https://image.tmdb.org/t/p/w1280${backdropPath}`;
            document.getElementById('modalHeroImage').style.backgroundImage = `url('${imageUrl}')`;
        }

        // Cast and Director (simplified)
        document.getElementById('modalCast').innerHTML = 'Cast information not available';
        document.getElementById('modalDirector').textContent = 'Director information not available';

        // Maturity description
        document.getElementById('modalMaturityDesc').textContent = this.getMaturityDescription(movie);

        // Setup play button
        this.setupModalPlayButton(movie, video);
        
        // Setup My List button
        this.setupModalMyListButton(movie);
    }

    setupModalPlayButton(movie, video) {
        const playBtns = this.modal?.querySelectorAll('.modal-play-btn, .modal-btn-play');
        
        playBtns.forEach(btn => {
            // Remove existing listeners
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', () => {
                if (video) {
                    const videoData = {
                        ...movie,
                        ...video,
                        key: video.key
                    };
                    this.openVideoPlayer(videoData);
                } else {
                    this.myListService.showNotification('No video available for this title', 'info');
                }
            });
        });
    }

    setupModalMyListButton(movie) {
        const myListBtn = this.modal?.querySelector('.modal-icon-btn.primary[aria-label="Add to my list"]');
        if (!myListBtn) return;

        // Update button state
        const isInList = this.myListService.isInMyList(movie.id);
        this.updateModalMyListButton(myListBtn, isInList);

        // Remove existing listener and add new one
        const newListBtn = myListBtn.cloneNode(true);
        myListBtn.parentNode.replaceChild(newListBtn, myListBtn);

        newListBtn.addEventListener('click', () => {
            const result = this.myListService.toggleMyList(movie);
            
            if (result === 'added') {
                this.myListService.showNotification(`${movie.title || movie.name} added to My List`);
                this.updateModalMyListButton(newListBtn, true);
            } else if (result === 'removed') {
                this.myListService.showNotification(`${movie.title || movie.name} removed from My List`);
                this.updateModalMyListButton(newListBtn, false);
                // Close modal and refresh list if removed
                setTimeout(() => {
                    this.closeModal();
                    this.loadMyList();
                }, 1000);
            } else {
                this.myListService.showNotification('Error updating My List', 'error');
            }
        });
    }

    updateModalMyListButton(button, isInList) {
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
        const modal = document.getElementById('movieModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const myListPage = new MyListPage();
    const profileManager = new ProfileManager();
});