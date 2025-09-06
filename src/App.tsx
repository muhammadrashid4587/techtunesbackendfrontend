import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import all page components
import HomePage from './components/HomePage';
import LessonIsland from './components/LessonIsland';
import GuitarTuner from './components/GuitarTuner';
import Login from './components/Login';
import Profile from './components/Profile';
import Admin from './components/Admin';
import Instructor from './components/Instructor';
import Pricing from './components/Pricing';
import Avatar from './components/Avatar';
import GuitarHeadstockView from './components/GuitarHeadstockView';
import LessonInstruments from './components/LessonInstruments';
import LessonsGuitar from './components/LessonsGuitar';
import LessonsInstruments from './components/LessonsInstruments';
import SampleLayout from './components/SampleLayout';
import Transition from './components/Transition';

// Registration components
import Reg1 from './components/registration/Reg1';
import Reg2 from './components/registration/Reg2';
import Reg3 from './components/registration/Reg3';
import Reg4 from './components/registration/Reg4';
import Reg5 from './components/registration/Reg5';
import Reg6 from './components/registration/Reg6';
import Reg7 from './components/registration/Reg7';
import Reg8 from './components/registration/Reg8';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Main pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/index.html" element={<HomePage />} />
          <Route path="/home.html" element={<HomePage />} />
          <Route path="/homepage.html" element={<HomePage />} />
          <Route path="/lesson_island.html" element={<LessonIsland />} />
          <Route path="/guitar_tuner.html" element={<GuitarTuner />} />
          <Route path="/login.html" element={<Login />} />
          <Route path="/profile.html" element={<Profile />} />
          <Route path="/admin.html" element={<Admin />} />
          <Route path="/instructor.html" element={<Instructor />} />
          <Route path="/pricing.html" element={<Pricing />} />
          <Route path="/avatar.html" element={<Avatar />} />
          <Route path="/guitar_headstock_view.html" element={<GuitarHeadstockView />} />
          <Route path="/lesson_instruments.html" element={<LessonInstruments />} />
          <Route path="/lessons_guitar.html" element={<LessonsGuitar />} />
          <Route path="/lessons_instruments.html" element={<LessonsInstruments />} />
          <Route path="/sampleLayout.html" element={<SampleLayout />} />
          <Route path="/transition.html" element={<Transition />} />
          
          {/* Registration pages */}
          <Route path="/reg1.html" element={<Reg1 />} />
          <Route path="/reg2.html" element={<Reg2 />} />
          <Route path="/reg3.html" element={<Reg3 />} />
          <Route path="/reg4.html" element={<Reg4 />} />
          <Route path="/reg5.html" element={<Reg5 />} />
          <Route path="/reg6.html" element={<Reg6 />} />
          <Route path="/reg7.html" element={<Reg7 />} />
          <Route path="/reg8.html" element={<Reg8 />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;