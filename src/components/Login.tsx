import React from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();

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
          maxWidth: '400px',
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
            Login
          </h1>
          
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <input
              type="email"
              placeholder="Email"
              style={{
                padding: '1rem',
                borderRadius: '10px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            <input
              type="password"
              placeholder="Password"
              style={{
                padding: '1rem',
                borderRadius: '10px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #d49efb, #4c1a80)',
                color: 'white',
                border: '2px solid white',
                borderRadius: '20px',
                padding: '1.2rem 3rem',
                fontSize: '1.2rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(212, 158, 251, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Login
            </button>
          </form>
          
          <p style={{ marginTop: '2rem', color: '#cccccc' }}>
            Don't have an account?{' '}
            <button 
              onClick={(e) => {
                e.preventDefault();
                navigate('/reg1.html');
              }}
              style={{ 
                color: '#d49efb', 
                textDecoration: 'none', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                fontSize: 'inherit',
                fontFamily: 'inherit'
              }}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
