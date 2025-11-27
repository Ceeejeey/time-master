# TimeMaster - Offline Time Management App 📱⏰

**A 100% offline-first mobile time management application built with React, Capacitor, and SQLite.**

## 🚀 Features

- **Eisenhower Matrix Task Management** - Prioritize tasks using the 4-quadrant system
- **Workplan Builder** - Create detailed work plans with time estimates
- **Today's Plan** - Daily timeblock planning with progress tracking
- **Focus Timer** - Productive time tracking with pause/resume
- **Reports & Analytics** - Visualize your productivity patterns
- **100% Offline** - All data stored locally in SQLite
- **No Login Required** - Simple onboarding with username only

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui components
- **Mobile**: Capacitor 7 (Android APK)
- **Database**: SQLite (@capacitor-community/sqlite)
- **State**: React Context API
- **Charts**: Recharts

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Android Studio (for APK builds)
- Java JDK 17+

### Setup

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd block-wise-plan

# Install dependencies
npm install

# Run development server
npm run dev
```

## 📱 Building Android APK

```sh
# Build web assets
npm run build

# Sync Capacitor plugins
npx cap sync android

# Build APK
cd android
./gradlew assembleDebug

# APK location:
# android/app/build/outputs/apk/debug/app-debug.apk
```

## 🗄️ Database Schema

The app uses SQLite with the following tables:

- `user_profile` - Local user profile (username, profile picture)
- `tasks` - Task management with priority quadrants
- `timeblocks` - Configurable time blocks (e.g., 25min, 45min)
- `workplans` - Work plans with task assignments
- `sessions` - Timer sessions (productive/wasted time tracking)
- `today_plans` - Daily plans with timeblock completion tracking

## 🎯 User Flow

1. **First Launch**: Onboarding screen asks for username
2. **Subsequent Launches**: Direct to home screen
3. **Task Creation**: Create tasks with Eisenhower priority
4. **Work Planning**: Build workplans with time estimates
5. **Daily Planning**: Select tasks and timeblocks for today
6. **Focus Timer**: Execute tasks with productivity tracking
7. **Reports**: Review productivity analytics

## 🔧 Project Structure

```
src/
├── database/
│   ├── index.ts          # SQLite DatabaseService
│   └── schema.ts         # Table definitions
├── contexts/
│   ├── AuthContext.tsx   # Local user state
│   └── DataContext.tsx   # Data loading/caching
├── pages/
│   ├── Onboarding.tsx    # Username input
│   ├── Home.tsx          # Dashboard
│   ├── Today.tsx         # Daily planning
│   ├── Workplan.tsx      # Work plan builder
│   ├── Timer.tsx         # Focus timer
│   ├── Reports.tsx       # Analytics
│   └── Settings.tsx      # App settings
├── components/
│   ├── Navigation.tsx    # Mobile nav bar
│   └── ui/              # shadcn components
└── lib/
    ├── storage.ts        # SQLite CRUD operations
    ├── types.ts          # TypeScript types
    └── utils.ts          # Utility functions
```

## 🧪 Testing

```sh
# Install APK on connected device
adb install android/app/build/outputs/apk/debug/app-debug.apk

# View logs
adb logcat | grep -i timemaster
```

## 📝 Development Notes

- All data stored in device SQLite database
- No network calls - fully offline
- Single user architecture (userId = '1')
- Auto-refresh data every 3 seconds in DataContext
- PWA support for web deployment

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

## 📄 License

MIT License - feel free to use for your own projects

---

**Built with ❤️ using React + Capacitor + SQLite**
