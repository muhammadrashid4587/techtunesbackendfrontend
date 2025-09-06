import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMouseTrail } from '../hooks/useMouseTrail';

const LessonIsland: React.FC = () => {
  const navigate = useNavigate();
  const [currentIsland, setCurrentIsland] = useState(0);
  const [bgNotes, setBgNotes] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);
  const [musicNotes, setMusicNotes] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);
  const islands = ['guitar', 'piano'];

  // Initialize mouse trail effect
  useMouseTrail();

  useEffect(() => {
    // Create background music notes
    const createBgNote = (index: number) => ({
      id: index,
      style: {
        left: `${10 + index * 10}%`,
        animationDuration: `${8 + index * 2}s`,
        animationDelay: `${index * 0.5}s`,
        fontSize: `${1.2 + index * 0.1}rem`,
      }
    });

    const bgNotesArray = Array.from({ length: 10 }, (_, i) => createBgNote(i));
    setBgNotes(bgNotesArray);

    // Create floating music notes
    const createMusicNote = (index: number) => ({
      id: index,
      style: {
        top: `${10 + index * 10}%`,
        left: index % 2 === 0 ? `${10 + index * 15}%` : `${15 + index * 12}%`,
        animationDelay: `${index}s`,
        fontSize: `${1.5 + index * 0.2}rem`,
      }
    });

    const musicNotesArray = Array.from({ length: 6 }, (_, i) => createMusicNote(i));
    setMusicNotes(musicNotesArray);
  }, []);

  const selectIsland = (island: string) => {
    if (island === 'guitar') {
      setCurrentIsland(0);
    } else if (island === 'piano') {
      setCurrentIsland(1);
    }
  };

  const navigateIsland = (direction: 'left' | 'right') => {
    setCurrentIsland(prev => 
      direction === 'left' 
        ? (prev - 1 + islands.length) % islands.length
        : (prev + 1) % islands.length
    );
  };

  const confirmSelection = () => {
    const selectedIsland = islands[currentIsland];
    if (selectedIsland === 'guitar') {
      navigate('/lessons_guitar.html');
    } else if (selectedIsland === 'piano') {
      alert('Piano lessons coming soon!');
    }
  };

  const selectedIsland = islands[currentIsland];

  return (
    <div style={{
      fontFamily: "'Poppins', sans-serif",
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundImage: 'url(/images/Brick_Wall.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative'
    }}>
      <style>{`
        :root {
          --primary-purple: #d49efb;
          --accent-yellow: #fceabb;
          --dark-purple: #4c1a80;
          --teal: #003d4d;
          --dark-bg: #0a0f0f;
          --white: #ffffff;
        }

        .jukebox-stage {
          position: relative;
          width: 90%;
          height: 85vh;
          left: -15%;
          right: 29%;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 5vh;
          z-index: 1;
        }

        .jukebox-image {
          width: 150%;
          height: auto;
          display: block;
          transition: all 0.3s ease;
          filter: drop-shadow(0 10px 20px rgba(0,0,0,.35));
        }

        .jukebox-hit {
          position: absolute;
          left: 20%;
          top: 32%;
          width: 60%;
          height: 36%;
          display: block;
          background: transparent;
          z-index: 5;
          outline: none;
          transition: all 0.3s ease;
          border-radius: 12px;
        }

        .screen-overlay {
          position: absolute;
          left: 20%;
          top: 32%;
          width: 60%;
          height: 36%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 6;
          pointer-events: auto;
        }

        .islands-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          margin: 0;
          z-index: 7;
          width: 100%;
          height: 100%;
          border-radius: 12px;
        }

        .island {
          position: relative;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          user-select: none;
          bottom: -100px;
          left: 50%;
        }

        .island.active { 
          transform: scale(1.08); 
          box-shadow: 0 20px 50px rgba(212, 158, 251, 0.4); 
          border: 3px solid #d49efb; 
        }

        .guitar-island { 
          width: 200px; 
          height: 200px; 
          background: #e6d7ff; 
          border: 3px solid rgba(255,255,255,0.35); 
        }
        
        .piano-island { 
          width: 180px; 
          height: 180px; 
          background: #ffd7e6; 
          border: 3px solid rgba(255,255,255,0.35); 
        }

        .island-text {
          position: absolute;
          color: var(--white);
          font-weight: 700;
          font-size: 1rem;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
          white-space: nowrap;
          letter-spacing: 1px;
        }

        .guitar-island .island-text.top,
        .piano-island .island-text.top { 
          top: 12%; 
          left: 50%; 
          transform: translateX(-50%); 
        }
        
        .guitar-island .island-text.bottom,
        .piano-island .island-text.bottom { 
          bottom: 12%; 
          left: 50%; 
          transform: translateX(-50%); 
        }

        .instrument-image { 
          width: 90px; 
          height: 90px; 
          margin: 12px 0; 
        }

        .coming-soon-banner {
          position: absolute;
          top: -10px; 
          right: -10px;
          background: #ff6b6b; 
          color: var(--white);
          padding: 6px 12px; 
          border-radius: 18px; 
          font-size: 0.75rem; 
          font-weight: 600;
          transform: rotate(15deg);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          z-index: 8;
        }

        .controls-container {
          position: absolute;
          bottom: -52%;
          left: 91.5%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 1.5rem;
          z-index: 7;
        }

        .nav-arrow { 
          width: 0; 
          height: 0; 
          border: none; 
          background: transparent;
          cursor: pointer; 
          transition: all 0.3s ease; 
          position: relative;
          opacity: 0;
        }
        
        .nav-arrow.left { 
          border-top: 16px solid transparent;
          left: -50px;
          bottom: -5px;
          border-bottom: 16px solid transparent; 
          border-right: 26px solid #87CEEB; 
          filter: drop-shadow(3px 3px 0 #1E3A8A) drop-shadow(1px 1px 0 #000); 
        }
        
        .nav-arrow.right { 
          border-top: 16px solid transparent;
          right: -50px;
          bottom: -3px;
          border-bottom: 16px solid transparent; 
          border-left: 26px solid #87CEEB; 
          filter: drop-shadow(-3px 3px 0 #1E3A8A) drop-shadow(-1px 1px 0 #000); 
        }
        
        .nav-arrow:hover { 
          transform: scale(1.1); 
        }

        .select-btn {
          background: #87CEEB;
          color: transparent;
          border: 2px solid #000;
          border-radius: 26px;
          opacity: 0;
          padding: 0.9rem 2.4rem;
          font-size: 1.2rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
          min-height: 52px;
          min-width: 110px;
          display: flex; 
          align-items: center; 
          justify-content: center;
          position: relative;
          box-shadow: 3px 3px 0 #1E3A8A, 1px 1px 0 #000;
        }
        
        .select-btn::before { 
          content: 'SELECT'; 
          position: absolute; 
          top: 50%; 
          left: 50%; 
          transform: translate(-50%, -50%); 
          color: #87CEEB; 
          font-size: 1.2rem; 
          font-weight: 700; 
          text-shadow: 1px 1px 0 #fff, -1px -1px 0 #1E3A8A; 
          z-index: 1; 
        }
        
        .select-btn:hover { 
          transform: translateY(-2px); 
          box-shadow: 4px 4px 0 #1E3A8A, 2px 2px 0 #000; 
        }
        
        .select-btn:active { 
          transform: translateY(1px); 
          box-shadow: 2px 2px 0 #1E3A8A, 0px 0px 0 #000; 
        }
        
        .select-btn:disabled { 
          opacity: 0.7; 
          cursor: not-allowed; 
        }

        .music-notes {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }

        .music-note {
          position: absolute;
          color: var(--primary-purple);
          font-size: 2rem;
          opacity: 0.3;
          animation: float 6s ease-in-out infinite;
          text-shadow: 0 0 10px rgba(212, 158, 251, 0.5);
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
            opacity: 0.6;
          }
        }

        .bg-music-notes {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .bg-note {
          position: absolute;
          color: rgba(212, 158, 251, 0.4);
          font-size: 1.5rem;
          animation: fall linear infinite;
          text-shadow: 0 0 5px rgba(212, 158, 251, 0.3);
        }

        @keyframes fall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        .floor-image {
          position: absolute;
          bottom: 0; 
          left: 0;
          width: 100%;
          z-index: 0;
          pointer-events: none;
        }
        
        .floor-image img { 
          width: 100%; 
          height: auto; 
          display: block; 
        }
      `}</style>

      {/* Background Music Notes */}
      <div className="bg-music-notes">
        {bgNotes.map(note => (
          <div key={note.id} className="bg-note" style={note.style}>
            {['♪', '♫', '♩', '♬', '♭', '♯', '♪', '♫', '♩', '♬'][note.id]}
          </div>
        ))}
      </div>

      {/* Floating Music Notes */}
      <div className="music-notes">
        {musicNotes.map(note => (
          <div key={note.id} className="music-note" style={note.style}>
            ♪
          </div>
        ))}
      </div>

      <div className="jukebox-stage">
        <div className="jukebox-wrap">
          <img 
            src="/Jukebox_Page_Assets/Final_Jukebox_Transparent.png"
            alt="Jukebox"
            className="jukebox-image" 
          />

          <button 
            className="jukebox-hit" 
            aria-label="Open instrument selection" 
            onClick={(e) => e.preventDefault()}
          />

          <div className="screen-overlay">
            <div className="islands-container">
              <div 
                className={`island guitar-island ${currentIsland === 0 ? 'active' : ''}`} 
                onClick={() => selectIsland('guitar')}
              >
                <div className="island-text top">GUITAR</div>
                <div className="island-text bottom">ISLAND</div>
                <img src="/Jukebox_Page_Assets/Guitar Island@4x.png" alt="Guitar" className="instrument-image" />
              </div>
              <div 
                className={`island piano-island ${currentIsland === 1 ? 'active' : ''}`} 
                onClick={() => selectIsland('piano')}
              >
                <div className="island-text top">ISLAND</div>
                <div className="island-text bottom">PIANO</div>
                <img src="/Jukebox_Page_Assets/Piano Island.png" alt="Piano" className="instrument-image" />
                <div className="coming-soon-banner">COMING SOON</div>
              </div>
            </div>

            <div className="controls-container">
              <button 
                className="nav-arrow left" 
                onClick={() => navigateIsland('left')} 
                aria-label="Previous instrument"
              />
              <button 
                className={`select-btn ${selectedIsland === 'piano' ? 'disabled' : ''}`}
                onClick={confirmSelection}
                disabled={selectedIsland === 'piano'}
                style={{ visibility: selectedIsland === 'piano' ? 'hidden' : 'visible' }}
              >
                SELECT
              </button>
              <button 
                className="nav-arrow right" 
                onClick={() => navigateIsland('right')} 
                aria-label="Next instrument"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="floor-image">
        <img src="/images/Floor.png" alt="Floor" />
      </div>
    </div>
  );
};

export default LessonIsland;
