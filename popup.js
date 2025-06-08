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
            const result = await chrome.storage.local.get(['wallpapers', 'autoChange', 'lastChanged']);
            
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
        } catch (error) {
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