chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Dynamic Wallpaper Hub installed successfully!');
        
         
        const defaultWallpapers = [
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop',
            'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&h=1080&fit=crop',
            'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1080&fit=crop',
            'https://images.unsplash.com/photo-1420593248178-d88870618ca0?w=1920&h=1080&fit=crop'
        ];
        
        chrome.storage.local.set({ 
            wallpapers: defaultWallpapers,
            autoChange: false 
        });
    }
});

chrome.action.onClicked.addListener((tab) => {
    if (tab.url && !tab.url.includes('chrome://newtab/') && !tab.url.includes('chrome-extension://')) {
        chrome.tabs.create({});
    }
});

let autoChangeAlarm = null;

chrome.storage.local.get(['autoChange', 'interval'], (result) => {
    if (result.autoChange) {
        setupAutoChangeAlarm(result.interval);
    }
});

function setupAutoChangeAlarm(interval) {
    chrome.alarms.clear('wallpaperChange');
    const minutes = (typeof interval === 'number' && interval >= 1 && interval <= 180) ? interval : 30;
    chrome.alarms.create('wallpaperChange', {
        delayInMinutes: minutes,
        periodInMinutes: minutes
    });
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'wallpaperChange') {
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                if (tab.url && tab.url.includes('chrome-extension://') && tab.url.includes('newtab.html')) {
                    chrome.tabs.sendMessage(tab.id, { action: 'changeWallpaper' });
                }
            });
        });
    }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.autoChange) {
            if (changes.autoChange.newValue) {
                chrome.storage.local.get(['interval'], (result) => {
                    setupAutoChangeAlarm(result.interval);
                });
            } else {
                chrome.alarms.clear('wallpaperChange');
            }
        }
        if (changes.interval) {
            chrome.storage.local.get(['autoChange'], (result) => {
                if (result.autoChange) {
                    setupAutoChangeAlarm(changes.interval.newValue);
                }
            });
        }
    }
});