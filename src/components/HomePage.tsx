import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMouseTrail } from '../hooks/useMouseTrail';
import '../styles/mousetrail.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [symbols, setSymbols] = useState<Array<{ id: number; symbol: string; style: React.CSSProperties }>>([]);

  // Initialize mouse trail effect
  useMouseTrail();

  useEffect(() => {
    const musicalSymbols = ['♪', '♫', '♬', '♭', '♯', '♩', '♨', '♮', '𝄞', '𝄢', '𝄡', '𝄽', '𝄾', '𝄿', '𝅀', '𝅁', '𝅂'];
    let symbolId = 0;

    const createSymbol = () => {
      const newSymbol = {
        id: symbolId++,
        symbol: musicalSymbols[Math.floor(Math.random() * musicalSymbols.length)],
        style: {
          left: Math.random() * 100 + '%',
          fontSize: (Math.random() * 2 + 1) + 'rem',
          animationDelay: Math.random() * 5 + 's',
          animationDuration: (Math.random() * 10 + 10) + 's',
        }
      };
      
      setSymbols(prev => [...prev, newSymbol]);
      
      // Remove symbol after animation completes
      setTimeout(() => {
        setSymbols(prev => prev.filter(s => s.id !== newSymbol.id));
      }, 20000);
    };

    // Create initial symbols
    for (let i = 0; i < 8; i++) {
      setTimeout(() => createSymbol(), i * 500);
    }

    // Continuously create new symbols
    const interval = setInterval(createSymbol, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleLogoClick = () => {
    navigate('/transition.html?target=home.html');
  };

  return (
    <div style={{
      margin: 0,
      background: 'linear-gradient(45deg, #0a0f0f, #4c1a80, #003d4d)',
      backgroundSize: '200% 200%',
      animation: 'gradientShift 10s ease infinite',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 80%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 80%; }
        }
        
        .floating-symbols {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .musical-symbol {
          position: absolute;
          color: rgba(255, 255, 255, 0.1);
          font-size: 2rem;
          animation: float 15s linear infinite;
          user-select: none;
        }

        .musical-symbol:nth-child(odd) {
          color: rgba(76, 26, 128, 0.2);
        }

        .musical-symbol:nth-child(3n) {
          color: rgba(0, 61, 77, 0.15);
        }

        @keyframes float {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) rotate(360deg);
            opacity: 0;
          }
        }

        .logo-container {
          opacity: 0;
          animation: fadeIn 3s ease-in-out forwards;
          cursor: pointer;
          transition: transform 0.3s ease, filter 0.3s ease;
          position: relative;
          z-index: 10;
        }

        .logo-container:hover {
          transform: scale(1.05);
          filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        img {
          max-width: 400px;
          height: auto;
          display: block;
        }

        .pulse {
          animation: float 15s linear infinite, pulse 3s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .glow {
          text-shadow: 0 0 10px currentColor;
        }
      `}</style>

      {/* Background brick wall */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'url(/images/Brick_Wall.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.3,
        zIndex: 0
      }} />

      {/* Floating symbols */}
      <div className="floating-symbols">
        {symbols.map(symbol => (
          <div
            key={symbol.id}
            className={`musical-symbol ${Math.random() < 0.3 ? 'pulse' : ''} ${Math.random() < 0.2 ? 'glow' : ''}`}
            style={symbol.style}
          >
            {symbol.symbol}
          </div>
        ))}
      </div>
      
      {/* Logo */}
      <div className="logo-container" onClick={handleLogoClick}>
        <img src="/images/TECHTUNESLOGO.png" alt="Tech Tunes Logo" />
      </div>
    </div>
  );
};

export default HomePage;
