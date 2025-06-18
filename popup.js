class PopupManager {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadStats();
        this.setupEventListeners();
    }

    async loadStats() {
        try {
            const result = await chrome.storage.local.get(['wallpapers', 'autoChange', 'lastChanged', 'interval', 'currentWallpaper']);
            
            const wallpaperCount = Array.isArray(result.wallpapers) ? result.wallpapers.length : 0;
            const wallpaperCountElem = document.getElementById('wallpaperCount');
            if (wallpaperCountElem) {
                wallpaperCountElem.textContent = wallpaperCount;
            }
            
            const autoChange = result.autoChange || false;
            const autoChangeStatusElem = document.getElementById('autoChangeStatus');
            if (autoChangeStatusElem) {
                autoChangeStatusElem.textContent = autoChange ? 'Enabled' : 'Disabled';
            }
            
            const toggle = document.getElementById('autoToggle');
            if (toggle) {
                if (autoChange) {
                    toggle.classList.add('active');
                } else {
                    toggle.classList.remove('active');
                }
            }
            
            const lastChanged = result.lastChanged || new Date().toISOString();
            const timeAgo = this.getTimeAgo(new Date(lastChanged));
            const lastChangedElem = document.getElementById('lastChanged');
            if (lastChangedElem) {
                lastChangedElem.textContent = timeAgo;
            }
            // Set interval input value
            const intervalInput = document.getElementById('intervalInput');
            if (intervalInput) {
                intervalInput.value = result.interval || 30;
            }
            // Show current wallpaper preview
            const preview = document.getElementById('wallpaperPreview');
            if (preview) {
                if (result.currentWallpaper) {
                    preview.src = result.currentWallpaper;
                    preview.style.display = 'block';
                } else {
                    preview.style.display = 'none';
                }
            }
        } catch (error) {
            const errorMsg = document.getElementById('errorMsg');
            if (errorMsg) {
                errorMsg.textContent = 'Failed to load stats.';
                errorMsg.style.display = 'block';
            }
        }
    }

    setupEventListeners() {
        const autoToggleElem = document.getElementById('autoToggle');
        if (autoToggleElem) {
            autoToggleElem.addEventListener('click', async () => {
                const toggle = document.getElementById('autoToggle');
                const isActive = toggle.classList.contains('active');
                
                if (isActive) {
                    toggle.classList.remove('active');
                    await chrome.storage.local.set({ autoChange: false });
                    const autoChangeStatusElem = document.getElementById('autoChangeStatus');
                    if (autoChangeStatusElem) {
                        autoChangeStatusElem.textContent = 'Disabled';
                    }
                } else {
                    toggle.classList.add('active');
                    await chrome.storage.local.set({ autoChange: true });
                    const autoChangeStatusElem = document.getElementById('autoChangeStatus');
                    if (autoChangeStatusElem) {
                        autoChangeStatusElem.textContent = 'Enabled';
                    }
                }
            });
        }

        const newWallpaperBtnElem = document.getElementById('newWallpaperBtn');
        if (newWallpaperBtnElem) {
            newWallpaperBtnElem.addEventListener('click', async () => {
                try {
                    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (activeTab && activeTab.url && activeTab.url.startsWith('chrome://newtab/')) {
                        await chrome.tabs.sendMessage(activeTab.id, { action: 'changeWallpaper' });
                    } else if (activeTab && activeTab.url && activeTab.url.startsWith('chrome-extension://') && activeTab.url.includes('newtab.html')) {
                        await chrome.tabs.sendMessage(activeTab.id, { action: 'changeWallpaper' });
                    } else {
                        await chrome.tabs.create({});
                    }

                    await chrome.storage.local.set({ lastChanged: new Date().toISOString() });
                    const lastChangedElem = document.getElementById('lastChanged');
                    if (lastChangedElem) {
                        lastChangedElem.textContent = 'Just now';
                    }

                } catch (error) {
                    await chrome.tabs.create({});
                }
            });
        }

        const addWallpaperBtnElem = document.getElementById('addWallpaperBtn');
        if (addWallpaperBtnElem) {
            addWallpaperBtnElem.addEventListener('click', async () => {
                try {
                    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (activeTab && (
                        (activeTab.url && activeTab.url.startsWith('chrome://newtab/')) ||
                        (activeTab.url && activeTab.url.startsWith('chrome-extension://') && activeTab.url.includes('newtab.html'))
                    )) {
                        await chrome.tabs.sendMessage(activeTab.id, { action: 'openSettings' });
                        await chrome.tabs.update(activeTab.id, { active: true });
                    } else {
                        const newTab = await chrome.tabs.create({});
                        setTimeout(async () => {
                            try {
                                await chrome.tabs.sendMessage(newTab.id, { action: 'openSettings' });
                            } catch (e) {
                            }
                        }, 1000);
                    }
                } catch (error) {
                    await chrome.tabs.create({});
                }
                window.close();
            });
        }

        const openNewTabBtnElem = document.getElementById('openNewTabBtn');
        if (openNewTabBtnElem) {
            openNewTabBtnElem.addEventListener('click', async () => {
                await chrome.tabs.create({});
                window.close();
            });
        }

        const manageBtnElem = document.getElementById('manageBtn');
        if (manageBtnElem) {
            manageBtnElem.addEventListener('click', async () => {
                try {
                    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (activeTab && (
                        (activeTab.url && activeTab.url.startsWith('chrome://newtab/')) ||
                        (activeTab.url && activeTab.url.startsWith('chrome-extension://') && activeTab.url.includes('newtab.html'))
                    )) {
                        await chrome.tabs.sendMessage(activeTab.id, { action: 'openSettings' });
                        await chrome.tabs.update(activeTab.id, { active: true });
                    } else {
                        await chrome.tabs.create({});
                    }
                } catch (error) {
                    await chrome.tabs.create({});
                }
                window.close();
            });
        }
        // Interval input change
        const intervalInput = document.getElementById('intervalInput');
        if (intervalInput) {
            intervalInput.addEventListener('change', async (e) => {
                let val = parseInt(e.target.value, 10);
                if (isNaN(val) || val < 1) val = 30;
                if (val > 180) val = 180;
                e.target.value = val;
                await chrome.storage.local.set({ interval: val });
            });
        }
        // Reset wallpapers
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', async () => {
                if (confirm('Reset wallpapers to default? This will remove all your custom wallpapers.')) {
                    const defaultWallpapers = [
                        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
                        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop',
                        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&h=1080&fit=crop',
                        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1080&fit=crop',
                        'https://images.unsplash.com/photo-1420593248178-d88870618ca0?w=1920&h=1080&fit=crop'
                    ];
                    await chrome.storage.local.set({ wallpapers: defaultWallpapers, currentWallpaper: defaultWallpapers[0] });
                    this.loadStats();
                }
            });
        }
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});