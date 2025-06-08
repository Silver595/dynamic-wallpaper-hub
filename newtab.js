class WallpaperHub {
    constructor() {
        this.wallpapers = [];
        this.currentWallpaper = null;
        this.autoChangeInterval = null;
        this.init();
    }

    async init() {
        await this.loadWallpapers();
        this.setupEventListeners();
        this.updateDateTime();
        this.setRandomWallpaper();
        this.setupAutoChange();
        this.loadWeather();
        setInterval(() => this.updateDateTime(), 1000);
    }

    async loadWallpapers() {
        try {
            let wallpapers;
            if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
                const result = await chrome.storage.local.get(['wallpapers']);
                wallpapers = result.wallpapers;
            } else {
                // Fallback for non-extension environments
                const stored = localStorage.getItem('wallpapers');
                wallpapers = stored ? JSON.parse(stored) : null;
            }
            this.wallpapers = wallpapers || this.getDefaultWallpapers();
            this.renderWallpaperGrid();
        } catch (error) {
            console.error('Error loading wallpapers:', error);
            this.wallpapers = this.getDefaultWallpapers();
        }
    }

    getDefaultWallpapers() {
        return [
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop',
            'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&h=1080&fit=crop',
            'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1080&fit=crop',
            'https://images.unsplash.com/photo-1420593248178-d88870618ca0?w=1920&h=1080&fit=crop',
        ];
    }

    setupEventListeners() {
  
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        const handleSearch = () => {
            const query = searchInput.value.trim();
            if (query) {
                if (query.includes('.') && !query.includes(' ')) {
                    window.location.href = query.startsWith('http') ? query : `https://${query}`;
                } else {
                    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                }
            }
        };

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
        searchBtn.addEventListener('click', handleSearch);

        // Control buttons
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.setRandomWallpaper();
        });

        document.getElementById('settingsBtn').addEventListener('click', () => {
            document.getElementById('settingsPanel').classList.add('active');
        });

        document.getElementById('closeSettings').addEventListener('click', () => {
            document.getElementById('settingsPanel').classList.remove('active');
        });

        // File upload
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.background = 'rgba(255,255,255,0.2)';
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.background = '';
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.background = '';
            this.handleFiles(e.dataTransfer.files);
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Auto-change checkbox
        document.getElementById('autoChange').addEventListener('change', (e) => {
            this.setupAutoChange(e.target.checked);
        });
    }

    async handleFiles(files) {
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.wallpapers.push(e.target.result);
                    this.saveWallpapers().then(() => {
                        this.renderWallpaperGrid();
                    });
                };
                reader.readAsDataURL(file);
            }
        }
    }

    async saveWallpapers() {
        try {
            if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
                await chrome.storage.local.set({ wallpapers: this.wallpapers });
            } else {
                // Fallback for non-extension environments
                localStorage.setItem('wallpapers', JSON.stringify(this.wallpapers));
            }
        } catch (error) {
            console.error('Error saving wallpapers:', error);
        }
    }

    renderWallpaperGrid() {
        const grid = document.getElementById('wallpaperGrid');
        grid.innerHTML = '';
        
        this.wallpapers.forEach((wallpaper, index) => {
            const img = document.createElement('img');
            img.src = wallpaper;
            img.className = 'wallpaper-thumb';
            img.title = 'Click to set as wallpaper';
            img.addEventListener('click', () => {
                this.setWallpaper(wallpaper);
            });
            
            const container = document.createElement('div');
            container.style.position = 'relative';
            container.appendChild(img);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '×';
            deleteBtn.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                background: rgba(255,0,0,0.7);
                color: white;
                border: none;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                cursor: pointer;
                font-size: 12px;
                display: none;
            `;
            
            container.addEventListener('mouseenter', () => {
                deleteBtn.style.display = 'block';
            });
            container.addEventListener('mouseleave', () => {
                deleteBtn.style.display = 'none';
            });
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeWallpaper(index);
            });
            
            container.appendChild(deleteBtn);
            grid.appendChild(container);
        });
    }

    async removeWallpaper(index) {
        this.wallpapers.splice(index, 1);
        await this.saveWallpapers();
        this.renderWallpaperGrid();
       
        if (!this.wallpapers.includes(this.currentWallpaper)) {
            this.setRandomWallpaper();
        }
    }

    setWallpaper(wallpaperUrl) {
        const container = document.getElementById('wallpaperContainer');
        if (!container) {
            console.error("Element with id 'wallpaperContainer' not found.");
            return;
        }
        container.style.backgroundImage = `url(${wallpaperUrl})`;
        this.currentWallpaper = wallpaperUrl;
        
        container.style.opacity = '0';
        setTimeout(() => {
            container.style.opacity = '1';
        }, 100);
    }

    setRandomWallpaper() {
        if (this.wallpapers.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.wallpapers.length);
            this.setWallpaper(this.wallpapers[randomIndex]);
        }
    }

    setupAutoChange(enable = null) {
        const checkbox = document.getElementById('autoChange');
        const intervalInput = document.getElementById('autoChangeInterval'); // Assume you have an <input id="autoChangeInterval" type="number" min="1" value="30">

        if (enable !== null) {
            checkbox.checked = enable;
        }

        if (this.autoChangeInterval) {
            clearInterval(this.autoChangeInterval);
            this.autoChangeInterval = null;
        }

        if (checkbox.checked) {
            let minutes = 30;
            if (intervalInput && intervalInput.value) {
                minutes = parseInt(intervalInput.value, 10);
                if (isNaN(minutes) || minutes < 1) minutes = 30;
            }
            this.autoChangeInterval = setInterval(() => {
                this.setRandomWallpaper();
            }, minutes * 60 * 1000);
        }
    }

    updateDateTime() {
        const now = new Date();
        const time = now.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
        const date = now.toLocaleDateString([], { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        document.getElementById('timeDisplay').textContent = time;
        document.getElementById('dateDisplay').textContent = date;
    }

    async loadWeather() {
        try {
            const weatherWidget = document.getElementById('weatherWidget');
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        // Use Open-Meteo (no API key required)
                        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
                        fetch(url)
                            .then(res => res.json())
                            .then(data => {
                                const weather = data.current_weather;
                                let icon = '🌤️';
                                if (weather.weathercode >= 80) icon = '🌧️';
                                else if (weather.weathercode >= 60) icon = '🌦️';
                                else if (weather.weathercode >= 50) icon = '🌫️';
                                else if (weather.weathercode >= 30) icon = '⛅';
                                else if (weather.weathercode >= 20) icon = '🌩️';
                                else if (weather.weathercode >= 10) icon = '☀️';
                                weatherWidget.innerHTML = `
                                    <div>📍 Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}</div>
                                    <div>${icon} ${weather.temperature}°C</div>
                                `;
                            })
                            .catch(() => {
                                weatherWidget.innerHTML = `
                                    <div>🌤️ Weather</div>
                                    <div>Unable to load</div>
                                `;
                            });
                    },
                    () => {
                        weatherWidget.innerHTML = `
                            <div>🌍 Weather</div>
                            <div>Enable location for local weather</div>
                        `;
                    }
                );
            } else {
                weatherWidget.innerHTML = `
                    <div>🌤️ Weather</div>
                    <div>Location not available</div>
                `;
            }
        } catch (error) {
            console.error('Weather loading error:', error);
            document.getElementById('weatherWidget').innerHTML = `
                <div>🌤️ Weather</div>
                <div>Unable to load</div>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WallpaperHub();
});

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'r':
                e.preventDefault();
                document.getElementById('refreshBtn').click();
                break;
            case ',':
                e.preventDefault();
                document.getElementById('settingsBtn').click();
                break;
        }
    }
    
    if (e.key === 's' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
    
    if (e.key === 'Escape') {
        document.getElementById('settingsPanel').classList.remove('active');
    }
});