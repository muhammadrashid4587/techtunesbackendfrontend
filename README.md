# Tech Tunes React

This is the React version of the Tech Tunes music learning application. The entire HTML/CSS/JavaScript project has been migrated to React with TypeScript while maintaining all the original functionality and design.

## Features

- **Home Page**: Animated logo with floating musical symbols
- **Lesson Island**: Interactive jukebox interface for instrument selection
- **Guitar Tuner**: Advanced guitar tuning with automatic and manual modes
- **User Authentication**: Login and registration system
- **Profile Management**: User profile and avatar creation
- **Admin Panel**: Administrative interface
- **Instructor Portal**: Instructor management system
- **Responsive Design**: Mobile-friendly interface

## Technology Stack

- **React 18** with TypeScript
- **React Router** for navigation
- **CSS3** with animations and gradients
- **Web Audio API** for guitar tuning
- **MediaRecorder API** for audio recording

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
   ```bash
   cd techtunes-react
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Building for Production

```bash
npm run build
```

This builds the app for production to the `build` folder.

## Project Structure

```
src/
├── components/           # React components
│   ├── HomePage.tsx     # Main landing page
│   ├── LessonIsland.tsx # Instrument selection
│   ├── GuitarTuner.tsx  # Guitar tuning interface
│   ├── Login.tsx        # User authentication
│   ├── Profile.tsx      # User profile
│   ├── Admin.tsx        # Admin panel
│   ├── Instructor.tsx   # Instructor portal
│   └── registration/    # Registration flow components
├── styles/              # CSS files
│   ├── mousetrail.css  # Mouse trail effects
│   ├── login.css       # Login page styles
│   ├── pickbot.css     # PickBot character styles
│   ├── profile.css     # Profile page styles
│   └── guitar_tuner.css # Guitar tuner styles
├── App.tsx             # Main app component
├── App.css             # Global styles
└── index.tsx           # Entry point
```

## Key Features Migrated

### 1. Home Page
- Animated gradient background
- Floating musical symbols with physics
- Interactive logo with hover effects
- Smooth transitions and animations

### 2. Lesson Island
- Interactive jukebox interface
- Instrument selection (Guitar/Piano)
- Navigation controls
- Coming soon indicators
- Responsive design

### 3. Guitar Tuner
- Real-time audio recording
- Advanced pitch detection
- Automatic and manual tuning modes
- Visual feedback with meters and arrows
- String selection interface
- Reference tone playback

### 4. Navigation
- React Router for client-side routing
- Smooth page transitions
- URL-based navigation
- Back/forward browser support

## Audio Features

The guitar tuner includes:
- **Web Audio API** integration
- **MediaRecorder** for audio capture
- **Real-time pitch detection**
- **Visual feedback** with animated meters
- **Reference tone playback**
- **Automatic/Manual modes**

## Styling

All original CSS has been preserved and integrated:
- **Gradient backgrounds** with animations
- **Custom cursors** with music note icons
- **Hover effects** and transitions
- **Responsive design** for mobile devices
- **Backdrop filters** for glass morphism effects

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Development

The project uses Create React App with TypeScript. All original functionality has been preserved while taking advantage of React's component-based architecture and state management.

## Original Project

This React version maintains 100% feature parity with the original HTML/CSS/JavaScript project while providing:
- Better code organization
- Type safety with TypeScript
- Component reusability
- Modern development tools
- Improved maintainability

## License

This project maintains the same license as the original Tech Tunes application.