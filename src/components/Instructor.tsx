import React from 'react';

const Instructor: React.FC = () => {
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
      flexDirection: 'column'
    }}>
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          25% { background-position: 100% 50%; }
          50% { background-position: 100% 100%; }
          75% { background-position: 0% 100%; }
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
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8rem 2rem 2rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '30px',
          padding: '3rem',
          width: '100%',
          maxWidth: '600px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            background: 'linear-gradient(45deg, #d49efb, #fceabb)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '2rem'
          }}>
            Instructor Portal
          </h1>
          
          <p style={{ fontSize: '1.2rem', color: '#cccccc', marginBottom: '2rem' }}>
            Instructor portal coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};

export default Instructor;
