# 🖼️ Dynamic Wallpaper Hub

**Transform your Chrome new tab into a stunning, personalized dashboard!**

---

## ✨ Features

- **🎨 Random Wallpapers:** Enjoy a fresh, high-quality wallpaper every time you open a new tab.
- **🔄 Auto-Change:** Let wallpapers rotate automatically at your chosen interval.
- **📁 Custom Uploads:** Add your own images (JPG, PNG, GIF, WEBP) via drag-and-drop or file picker.
- **🔍 Smart Search:** Instantly search Google or type a URL right from your new tab.
- **⚡ Quick Links:** One-click access to Gmail, YouTube, GitHub, and Twitter.
- **🌦️ Weather Widget:** See your local weather using geolocation.
- **🗂️ Wallpaper Management:** View, set, or remove wallpapers from your collection.
- **⚙️ Popup Controls:** Change wallpaper, add new ones, or manage your collection from the extension popup.

---

## 📂 Folder Structure

```
custom_wallpaper/
├── background.js      # Background logic for alarms and tab management
├── manifest.json      # Chrome extension manifest (v3)
├── newtab.html        # Custom new tab page UI
├── newtab.js          # Wallpaper, search, weather, and settings logic
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic for quick actions and stats
└── icons/             # Extension icons (16/48/128px)
```

---

## 🚀 Getting Started

1. **Install the Extension**
   - Go to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `custom_wallpaper` folder

2. **Open a New Tab**
   - Experience a beautiful, dynamic dashboard with wallpapers, search, quick links, and weather.

3. **Manage Wallpapers**
   - Click ⚙️ **Settings** or use the popup to add/remove wallpapers.

4. **Enable Auto-Change**
   - Toggle auto-change in settings or the popup to rotate wallpapers automatically.

5. **Use the Popup**
   - Click the extension icon for quick actions and stats.

---

## 🛡️ Permissions

- `storage`: Save wallpapers and settings
- `activeTab`: Interact with the current tab for wallpaper changes

---

## 🙏 Credits

- Wallpapers from [Unsplash](https://unsplash.com)
- Weather data from [Open-Meteo](https://open-meteo.com)

---

## 📖 Source Files

- [`background.js`](custom_wallpaper/background.js)
- [`newtab.html`](custom_wallpaper/newtab.html)
- [`newtab.js`](custom_wallpaper/newtab.js)
- [`popup.html`](custom_wallpaper/popup.html)
- [`popup.js`](custom_wallpaper/popup.js)
- [`manifest.json`](custom_wallpaper/manifest.json)

---

> **Enjoy a new look every time you open a tab!**
