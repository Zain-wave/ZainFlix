# 🎬 ZainFlix

Next-generation streaming platform with a modern, component-based architecture.

## ✨ Features

- 🎬 **Movie Catalog**: Browse trending movies and TV shows from TMDB API
- 📝 **My List**: Save your favorite content for later
- 👤 **Profile Management**: Multiple user profiles with custom themes
- 🔐 **Authentication**: Secure login and registration system
- 🎮 **Video Player**: YouTube integration for trailers and clips
- 📱 **Responsive Design**: Works perfectly on all devices
- 🎨 **Modern UI**: Beautiful dark theme with cyberpunk aesthetics

## 🚀 Quick Start

### Using Node.js (Recommended)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Using Python

```bash
# Simple HTTP server
python -m http.server 8080 --directory src/pages
```

Then open http://localhost:8080 in your browser.

## 📁 Project Structure

```
src/
├── pages/                   # HTML entry points
│   ├── index.html          # Landing page
│   ├── login.html          # Authentication
│   ├── register.html       # Registration
│   ├── profile.html        # Profile selection
│   ├── home.html           # Main dashboard
│   ├── mylist.html         # User's saved content
│   └── video-player.html   # Media player
├── assets/
│   ├── styles/              # CSS stylesheets
│   │   ├── base/           # Variables, reset, typography
│   │   ├── components/     # Reusable component styles
│   │   ├── layout/         # Layout styles
│   │   └── pages/          # Page-specific styles
│   ├── scripts/             # JavaScript modules
│   │   ├── core/           # Core functionality
│   │   ├── components/     # Reusable components
│   │   ├── services/       # API and data services
│   │   └── pages/          # Page-specific logic
│   └── images/             # Static images
├── public/                  # Public assets
└── docs/                   # Documentation
```

## 🛠 Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **API**: TMDB (The Movie Database)
- **Video**: YouTube IFrame API
- **Icons**: Google Material Symbols
- **Fonts**: Google Fonts (Spline Sans, Orbitron)

## 🎯 Architecture Highlights

- **Component-Based**: Reusable, modular JavaScript components
- **Service Layer**: Clean separation of API calls and business logic
- **Responsive First**: Mobile-first design with progressive enhancement
- **Modern CSS**: CSS Grid, Flexbox, Custom Properties
- **ES6 Modules**: Clean import/export structure
- **Error Handling**: Comprehensive error management and user feedback

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile 90+)

## 🔧 Development

### Adding New Pages

1. Create HTML in `src/pages/`
2. Create CSS in `src/assets/styles/pages/`
3. Create JavaScript in `src/assets/scripts/pages/`
4. Import necessary components and services

### Adding Components

1. Create component class in `src/assets/scripts/components/`
2. Create corresponding CSS in `src/assets/styles/components/`
3. Export and import where needed

### API Configuration

All API settings are in `src/assets/scripts/services/api.js`. Update the TMDB API token there.

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run linting (when implemented)
npm run lint
```

## 📚 Documentation

- [Development Guide](docs/DEVELOPMENT.md)
- [Project Structure](docs/STRUCTURE.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🚀 Deployment

The `src/pages` directory should be served as the web root. The application works with any static web server.

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Use ES6+ features and modern CSS
3. Write responsive, accessible code
4. Test on multiple browsers
5. Update documentation as needed

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- TMDB for providing the movie database API
- Google for Material Symbols and Fonts
- YouTube for video hosting services

---

**ZainFlix** - Built with ❤️ using modern web technologies