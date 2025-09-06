import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Transition: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const target = searchParams.get('target');

  useEffect(() => {
    if (target) {
      // Add a small delay for transition effect
      const timer = setTimeout(() => {
        navigate(`/${target}`);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      navigate('/');
    }
  }, [target, navigate]);

  return (
    <div style={{
      margin: 0,
      background: 'linear-gradient(135deg, #0a0f0f, #4c1a80, #003d4d)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 12s ease infinite',
      fontFamily: "'Poppins', sans-serif",
      color: '#ffffff',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          25% { background-position: 100% 50%; }
          50% { background-position: 100% 100%; }
          75% { background-position: 0% 100%; }
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 5px solid rgba(255, 255, 255, 0.3);
          border-top: 5px solid #d49efb;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 2rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
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

      <div style={{
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(20px)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '30px',
        padding: '3rem',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <div className="loading-spinner"></div>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          background: 'linear-gradient(45deg, #d49efb, #fceabb)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '1rem'
        }}>
          Loading...
        </h2>
        <p style={{ fontSize: '1rem', color: '#cccccc' }}>
          {target ? `Redirecting to ${target}...` : 'Redirecting to home...'}
        </p>
      </div>
    </div>
  );
};

export default Transition;
