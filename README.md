# MySpace — Minimal Cinematic Productivity Dashboard
### Production-Grade Chrome New Tab Extension (Manifest V3)

> A luxury, cinematic, glassmorphic productivity dashboard replacing Google Chrome's New Tab page. Built with React 19, TypeScript, Vite, Tailwind CSS, and local-first IndexedDB storage.

---

## 🌟 Visual & Architectural Highlights

- **Cinematic Scenery**: Mountain & cloud sunset backdrop (high-resolution photography), with real-time visual filter adjustments (brightness, blur, contrast, saturation, dark tint overlay, and vignette).
- **Hidden Sidebar Design**: Clean, minimal, distraction-free aesthetic by default. Features a circular `•••` trigger at the top-left that smoothly slides in the sidebar drawer, collapsing automatically on `Escape` or clicking outside.
- **Hero & Dynamic Greeting**: Time-aware greetings (`Good Morning ☀️`, `Good Afternoon 🌤️`, `Good Evening 🌙`), formatted calendar date, and customizable motivational quote system with shuffle and custom creation.
- **Large Glass Search Bar**: Instant direct URL navigation, Google search (or DuckDuckGo, Bing, Brave, Ecosia), `Ctrl/Cmd + K` shortcut, and Web Speech API voice search.
- **Live Widgets**: Live seconds clock (12h/24h) and real-time live weather powered by Open-Meteo with automatic browser geolocation or manual city search.
- **Scalable Bookmark System**: Backed by **IndexedDB** for virtually unlimited bookmarks. Supports full drag-and-drop within and between sections, custom colors, descriptions, multi-layer favicon resolution with fallback initials, and right-click context menu.
- **Workspace Profiles**: Seamless switching between `Work`, `Personal`, and custom workspaces with distinct sections, wallpapers, and links.
- **Chrome Bookmarks Sync**: Import Chrome bookmark folders safely into organized sections without altering original Chrome bookmarks, plus full offline JSON export and import.
- **Quick Notes & To-Do**: Integrated local notes with pinning and task manager with priorities and filters.
- **Focus Mode**: Distraction-free Pomodoro timer (25 min, 50 min, custom) with Web Audio synthesized harmonic bells.

---

## 📂 Project Structure

```
HR Space Extension/
├── dist/                              # Ready-to-load unpacked Chrome Extension
│   ├── assets/                        # Compiled CSS & JS bundles
│   ├── icons/                         # 16x16, 32x32, 48x48, 128x128 icons
│   ├── wallpapers/                    # Built-in HD scenic wallpapers
│   ├── background.js                  # Manifest V3 service worker
│   ├── index.html                     # New Tab HTML entry
│   └── manifest.json                  # Manifest V3 extension configuration
├── public/                            # Static assets & extension template
│   ├── background.js
│   ├── manifest.json
│   ├── icons/
│   └── wallpapers/
├── src/
│   ├── types/
│   │   └── index.ts                   # Strongly-typed data models
│   ├── db/
│   │   ├── indexedDB.ts               # Scalable IndexedDB storage layer
│   │   └── initialData.ts             # Default demo sections & bookmarks
│   ├── context/
│   │   └── AppContext.tsx             # Global application state management
│   ├── hooks/
│   │   ├── useClock.ts                # Live 1-second clock
│   │   ├── useWeather.ts              # Real-time Open-Meteo weather
│   │   ├── useShortcuts.ts            # Global keyboard shortcuts
│   │   └── useSpeechRecognition.ts    # Voice search Web Speech API
│   ├── utils/
│   │   ├── chromeApi.ts               # Chrome bookmarks & tabs API
│   │   ├── favicon.ts                 # Multi-tier favicon resolver
│   │   ├── sound.ts                   # Web Audio API chime generator
│   │   └── formatters.ts              # URLs, dates, and greetings
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── BackgroundLayer.tsx    # Wallpaper with filter adjustments
│   │   │   ├── Header.tsx             # Top header with circular ••• button
│   │   │   ├── Sidebar.tsx            # Hidden slide-over navigation drawer
│   │   │   └── FloatingBottomNav.tsx  # Floating glass pill controls
│   │   ├── TopArea/
│   │   │   ├── Greeting.tsx           # Time-based greeting & date
│   │   │   ├── ClockWidget.tsx        # Live clock widget
│   │   │   ├── WeatherWidget.tsx      # Weather card with details popover
│   │   │   └── QuoteWidget.tsx        # Motivational quote system
│   │   ├── Search/
│   │   │   ├── SearchBar.tsx          # Centered glass search bar
│   │   │   └── CommandPalette.tsx     # Global fuzzy search (Ctrl+K)
│   │   ├── Bookmarks/
│   │   │   ├── SectionCard.tsx        # Glassmorphic section container
│   │   │   ├── BookmarkCard.tsx       # Shortcut card with 5 layouts
│   │   │   ├── BookmarkGrid.tsx       # Reorderable sections grid
│   │   │   ├── BookmarkContextMenu.tsx# Custom right-click context menu
│   │   │   ├── AddBookmarkModal.tsx   # Add/Edit bookmark modal
│   │   │   └── AddSectionModal.tsx    # Add/Edit section modal
│   │   ├── Panels/
│   │   │   ├── WallpaperPickerModal.tsx# Presets, upload, and sliders
│   │   │   ├── CustomizePanel.tsx     # Themes, density, settings
│   │   │   ├── NotesPanel.tsx         # Quick notes drawer
│   │   │   ├── TodoPanel.tsx          # Minimal tasks drawer
│   │   │   ├── FocusMode.tsx          # Pomodoro full-screen view
│   │   │   ├── BookmarksManagerModal.tsx# Search & sort all bookmarks
│   │   │   ├── ChromeImportExportModal.tsx# Import Chrome bookmarks & JSON
│   │   │   └── WorkspaceModal.tsx     # Work / Personal workspaces
│   │   └── UI/
│   │       └── Toast.tsx              # Animated glass notifications
│   ├── App.tsx                        # Master layout assembler
│   ├── main.tsx                       # React DOM entry
│   └── index.css                      # Tailwind & glassmorphism classes
├── index.html                         # Root HTML
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Installation into Google Chrome

### Step 1: Open Chrome Extensions
1. Open Google Chrome.
2. In the URL address bar, enter:
   ```
   chrome://extensions
   ```
3. Enable **Developer mode** using the toggle switch located in the **top-right corner**.

### Step 2: Load Unpacked Extension
1. Click the **Load unpacked** button located in the top-left area.
2. In the folder picker dialog, select the **`dist`** directory inside this project:
   ```
   c:\Users\HASIB\Desktop\HR Space Extension\dist
   ```
3. Click **Select Folder**.

### Step 3: Open a New Tab
1. Open a new tab (`Ctrl + T` or click the `+` icon).
2. Chrome may show a prompt: *"Is this the new tab page you were expecting?"*. Click **Keep changes**.
3. Welcome to your new **MySpace** cinematic dashboard!

---

## 🛠️ Local Development & Build Commands

If you make modifications to the source code:

```bash
# 1. Run the local preview / development server
npm run dev

# 2. Build for production (outputs to /dist)
npm run build
```

Once built, simply click the **Refresh** (⟳) icon on the MySpace card at `chrome://extensions` to immediately load your updates.

---

## 🔐 Explanation of Permissions

| Permission | Purpose | Why It's Necessary |
|---|---|---|
| `storage` | Persistence | Saves user layout preferences and active theme settings locally in `chrome.storage.local`. |
| `bookmarks` | Chrome Bookmarks Integration | Enables the **Import Chrome Bookmarks** feature, allowing users to import their browser bookmarks directly into MySpace sections without altering the original Chrome hierarchy. |
| `favicon` | Chrome Favicon API | Resolves high-resolution website favicons from Chrome's internal cache for lightning-fast, privacy-preserving shortcut icons. |

> **Privacy Guarantee**: All data (bookmarks, notes, tasks, wallpapers) is stored strictly on your local computer via **IndexedDB**. Zero browsing history or telemetry is transmitted to external servers.

---

## ⌨️ Keyboard Shortcuts

- `Ctrl / Cmd + K`: Open Global Command Palette & instant search
- `Ctrl / Cmd + B`: Open Bookmarks Manager
- `Ctrl / Cmd + Shift + F`: Toggle Focus Mode (Pomodoro)
- `Ctrl / Cmd + ,`: Open Customization & Themes panel
- `Escape`: Close any active modal, context menu, or the slide-over sidebar

---

## 🔮 Future Upgrade Ideas

1. **Custom CSS / Custom Themes**: Let users write custom glass styling rules.
2. **Animated / Live Video Wallpapers**: HTML5 canvas live ambient shaders (e.g. falling snow, fireflies, cosmic dust).
3. **RSS / News Feeds**: Embedded glass reader for Hacker News, TechCrunch, or Reddit feeds.
4. **Calendar Integration**: Google Calendar / Outlook OAuth integration to display upcoming agenda events directly on the dashboard.
5. **Multi-device Cloud Sync**: Optional end-to-end encrypted sync between multiple Chrome profiles or browsers using WebRTC or Supabase.
