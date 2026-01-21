# ZainFlix Development Environment

## Quick Start

```bash
# Install dependencies (if you want to use Node.js server)
npm install

# Start development server
npm run dev
```

Then open your browser and navigate to:
- Main page: http://localhost:8080/index.html
- Home (after login): http://localhost:8080/home.html
- My List: http://localhost:8080/mylist.html

## Alternative: Simple Python Server

If you don't have Node.js:

```bash
# From project root
python -m http.server 8080 --directory src/pages
```

## Project Structure

```
src/
├── pages/                   # HTML files
│   ├── index.html           # Landing page
│   ├── login.html           # Login page
│   ├── register.html        # Registration page
│   ├── profile.html         # Profile selection
│   ├── home.html           # Main dashboard
│   ├── mylist.html         # My list page
│   └── video-player.html   # Video player
├── assets/
│   ├── styles/              # CSS files
│   │   ├── base/           # Base styles (variables, reset)
│   │   ├── components/     # Reusable component styles
│   │   ├── layout/         # Layout styles
│   │   └── pages/          # Page-specific styles
│   ├── scripts/             # JavaScript files
│   │   ├── core/           # Core functionality
│   │   ├── components/     # Reusable components
│   │   ├── services/       # API and data services
│   │   └── pages/          # Page-specific logic
│   └── images/             # Static images
├── public/                  # Public assets
└── docs/                   # Documentation
```

## Features

- 🎬 **Movie Catalog**: Browse trending movies and TV shows
- 📝 **My List**: Save your favorite content
- 👤 **Profile Management**: Multiple user profiles
- 🔐 **Authentication**: Login/Register system
- 🎮 **Video Player**: YouTube integration for trailers
- 📱 **Responsive Design**: Works on all devices

## Development Guidelines

### Adding New Pages

1. Create HTML file in `src/pages/`
2. Create corresponding CSS file in `src/assets/styles/pages/`
3. Create corresponding JS file in `src/assets/scripts/pages/`
4. Import necessary components and services

### Adding New Components

1. Create component class in `src/assets/scripts/components/`
2. Create corresponding CSS in `src/assets/styles/components/`
3. Import and use in pages

### API Integration

All API configuration is in `src/assets/scripts/services/api.js`. Movie data is fetched from TMDB API.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile 90+)

## Contributing

1. Follow the existing code structure
2. Use ES6+ features
3. Write responsive CSS
4. Test on multiple browsers
5. Update documentation

## Deployment

For production deployment, the `src/pages` folder should be served as the web root.