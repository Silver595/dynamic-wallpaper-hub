class WallpaperHub {
    constructor() {
        this.wallpapers = [];
        this.currentWallpaper = null;
        this.autoChangeInterval = null;
        this.shuffleMode = false;
        this.init();
    }

    async init() {
        await this.loadWallpapers();
        this.setupEventListeners();
        this.updateDateTime();
        this.setRandomWallpaper();
        this.setupAutoChange();
        this.loadWeather();
        this.loadDailyQuote();
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
            if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                // Warn if file is too large (e.g., >2MB)
                if (file.size > 2 * 1024 * 1024) {
                    alert('File too large! Please use images/videos under 2MB.');
                    continue;
                }
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
            // Warn if total size is too large
            const totalSize = this.wallpapers.reduce((acc, w) => acc + (w.length || 0), 0);
            if (totalSize > 4 * 1024 * 1024) {
                alert('Too many wallpapers! Please keep total under 4MB.');
                return;
            }
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
            let mediaElem;
            if (wallpaper.startsWith('data:video/')) {
                mediaElem = document.createElement('video');
                mediaElem.src = wallpaper;
                mediaElem.className = 'wallpaper-thumb';
                mediaElem.title = 'Click to set as wallpaper';
                mediaElem.muted = true;
                mediaElem.loop = true;
                mediaElem.autoplay = true;
            } else {
                mediaElem = document.createElement('img');
                mediaElem.src = wallpaper;
                mediaElem.className = 'wallpaper-thumb';
                mediaElem.title = 'Click to set as wallpaper';
            }
            mediaElem.addEventListener('click', () => {
                this.setWallpaper(wallpaper);
            });
            const container = document.createElement('div');
            container.style.position = 'relative';
            container.appendChild(mediaElem);
            
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
        if (wallpaperUrl.startsWith('data:video/')) {
            container.innerHTML = `<video src="${wallpaperUrl}" autoplay loop muted style="width:100vw;height:100vh;object-fit:cover;"></video>`;
        } else {
            container.innerHTML = '';
            container.style.backgroundImage = `url(${wallpaperUrl})`;
        }
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
            if (!weatherWidget) return;
            weatherWidget.innerHTML = '<div>🌤️ Weather</div><div>Loading...</div>';
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        // Get city name using reverse geocoding (Nominatim OpenStreetMap)
                        let city = '';
                        try {
                            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
                            if (geoRes.ok) {
                                const geoData = await geoRes.json();
                                city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.state || '';
                            }
                        } catch {}
                        // Use Open-Meteo for weather
                        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
                        try {
                            const res = await fetch(url);
                            if (!res.ok) throw new Error('Weather fetch failed');
                            const data = await res.json();
                            if (data.current_weather) {
                                const temp = data.current_weather.temperature;
                                const wind = data.current_weather.windspeed;
                                const code = data.current_weather.weathercode;
                                const desc = this.getWeatherDescription(code);
                                weatherWidget.innerHTML = `
                                    <div>🌤️ Weather${city ? ' in ' + city : ''}</div>
                                    <div><b>${temp}°C</b> ${desc}</div>
                                    <div style="font-size:0.9em;opacity:0.7;">Wind: ${wind} km/h</div>
                                `;
                            } else {
                                weatherWidget.innerHTML = '<div>🌤️ Weather</div><div>Data unavailable</div>';
                            }
                        } catch (e) {
                            weatherWidget.innerHTML = '<div>🌤️ Weather</div><div>Unable to load</div>';
                        }
                    },
                    (err) => {
                        weatherWidget.innerHTML = '<div>🌤️ Weather</div><div>Location not available. Please allow location access for accurate weather.</div>';
                    },
                    { timeout: 10000 }
                );
            } else {
                weatherWidget.innerHTML = '<div>🌤️ Weather</div><div>Location not available</div>';
            }
        } catch (error) {
            const weatherWidget = document.getElementById('weatherWidget');
            if (weatherWidget) {
                weatherWidget.innerHTML = '<div>🌤️ Weather</div><div>Unable to load</div>';
            }
        }
    }

    getWeatherDescription(code) {
        // Open-Meteo weather codes: https://open-meteo.com/en/docs#api_form
        const map = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Fog',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Drizzle',
            55: 'Dense drizzle',
            56: 'Freezing drizzle',
            57: 'Freezing dense drizzle',
            61: 'Slight rain',
            63: 'Rain',
            65: 'Heavy rain',
            66: 'Freezing rain',
            67: 'Heavy freezing rain',
            71: 'Slight snow',
            73: 'Snow',
            75: 'Heavy snow',
            77: 'Snow grains',
            80: 'Slight rain showers',
            81: 'Rain showers',
            82: 'Violent rain showers',
            85: 'Slight snow showers',
            86: 'Heavy snow showers',
            95: 'Thunderstorm',
            96: 'Thunderstorm w/ hail',
            99: 'Thunderstorm w/ heavy hail',
        };
        return map[code] || 'Unknown';
    }

    async loadDailyQuote() {
        const quoteText = document.getElementById('quoteText');
        const quoteAuthor = document.getElementById('quoteAuthor');
        if (!quoteText || !quoteAuthor) return;
        try {
            // Use quotable.io for free daily quotes
            const res = await fetch('https://api.quotable.io/random');
            if (!res.ok) throw new Error('Failed to fetch quote');
            const data = await res.json();
            quoteText.textContent = `“${data.content}”`;
            quoteAuthor.textContent = data.author ? `— ${data.author}` : '';
        } catch (e) {
            quoteText.textContent = 'Stay positive and keep moving forward!';
            quoteAuthor.textContent = '';
        }
    }

    async handleFiles(files) {
        for (const file of files) {
            if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                // Warn if file is too large (e.g., >2MB)
                if (file.size > 2 * 1024 * 1024) {
                    alert('File too large! Please use images/videos under 2MB.');
                    continue;
                }
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
            // Warn if total size is too large
            const totalSize = this.wallpapers.reduce((acc, w) => acc + (w.length || 0), 0);
            if (totalSize > 4 * 1024 * 1024) {
                alert('Too many wallpapers! Please keep total under 4MB.');
                return;
            }
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
            let mediaElem;
            if (wallpaper.startsWith('data:video/')) {
                mediaElem = document.createElement('video');
                mediaElem.src = wallpaper;
                mediaElem.className = 'wallpaper-thumb';
                mediaElem.title = 'Click to set as wallpaper';
                mediaElem.muted = true;
                mediaElem.loop = true;
                mediaElem.autoplay = true;
            } else {
                mediaElem = document.createElement('img');
                mediaElem.src = wallpaper;
                mediaElem.className = 'wallpaper-thumb';
                mediaElem.title = 'Click to set as wallpaper';
            }
            mediaElem.addEventListener('click', () => {
                this.setWallpaper(wallpaper);
            });
            const container = document.createElement('div');
            container.style.position = 'relative';
            container.appendChild(mediaElem);
            
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
        if (wallpaperUrl.startsWith('data:video/')) {
            container.innerHTML = `<video src="${wallpaperUrl}" autoplay loop muted style="width:100vw;height:100vh;object-fit:cover;"></video>`;
        } else {
            container.innerHTML = '';
            container.style.backgroundImage = `url(${wallpaperUrl})`;
        }
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
            if (!weatherWidget) return;
            weatherWidget.innerHTML = '<div>🌤️ Weather</div><div>Loading...</div>';
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        // Get city name using reverse geocoding (Nominatim OpenStreetMap)
                        let city = '';
                        try {
                            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
                            if (geoRes.ok) {
                                const geoData = await geoRes.json();
                                city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.state || '';
                            }
                        } catch {}
                        // Use Open-Meteo for weather
                        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
                        try {
                            const res = await fetch(url);
                            if (!res.ok) throw new Error('Weather fetch failed');
                            const data = await res.json();
                            if (data.current_weather) {
                                const temp = data.current_weather.temperature;
                                const wind = data.current_weather.windspeed;
                                const code = data.current_weather.weathercode;
                                const desc = this.getWeatherDescription(code);
                                weatherWidget.innerHTML = `
                                    <div>🌤️ Weather${city ? ' in ' + city : ''}</div>
                                    <div><b>${temp}°C</b> ${desc}</div>
                                    <div style="font-size:0.9em;opacity:0.7;">Wind: ${wind} km/h</div>
                                `;
                            } else {
                                weatherWidget.innerHTML = '<div>🌤️ Weather</div><div>Data unavailable</div>';
                            }
                        } catch (e) {
                            weatherWidget.innerHTML = '<div>🌤️ Weather</div><div>Unable to load</div>';
                        }
                    },
                    (err) => {
                        weatherWidget.innerHTML = '<div>🌤️ Weather</div><div>Location not available. Please allow location access for accurate weather.</div>';
                    },
                    { timeout: 10000 }
                );
            } else {
                weatherWidget.innerHTML = '<div>🌤️ Weather</div><div>Location not available</div>';
            }
        } catch (error) {
            const weatherWidget = document.getElementById('weatherWidget');
            if (weatherWidget) {
                weatherWidget.innerHTML = '<div>🌤️ Weather</div><div>Unable to load</div>';
            }
        }
    }

    getWeatherDescription(code) {
        // Open-Meteo weather codes: https://open-meteo.com/en/docs#api_form
        const map = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Fog',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Drizzle',
            55: 'Dense drizzle',
            56: 'Freezing drizzle',
            57: 'Freezing dense drizzle',
            61: 'Slight rain',
            63: 'Rain',
            65: 'Heavy rain',
            66: 'Freezing rain',
            67: 'Heavy freezing rain',
            71: 'Slight snow',
            73: 'Snow',
            75: 'Heavy snow',
            77: 'Snow grains',
            80: 'Slight rain showers',
            81: 'Rain showers',
            82: 'Violent rain showers',
            85: 'Slight snow showers',
            86: 'Heavy snow showers',
            95: 'Thunderstorm',
            96: 'Thunderstorm w/ hail',
            99: 'Thunderstorm w/ heavy hail',
        };
        return map[code] || 'Unknown';
    }

    async loadDailyQuote() {
        const quoteText = document.getElementById('quoteText');
        const quoteAuthor = document.getElementById('quoteAuthor');
        if (!quoteText || !quoteAuthor) return;
        try {
            // Use quotable.io for free daily quotes
            const res = await fetch('https://api.quotable.io/random');
            if (!res.ok) throw new Error('Failed to fetch quote');
            const data = await res.json();
            quoteText.textContent = `“${data.content}”`;
            quoteAuthor.textContent = data.author ? `— ${data.author}` : '';
        } catch (e) {
            quoteText.textContent = 'Stay positive and keep moving forward!';
            quoteAuthor.textContent = '';
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