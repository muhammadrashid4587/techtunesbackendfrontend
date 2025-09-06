import { useEffect } from 'react';

export const useMouseTrail = () => {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const note = document.createElement('div');
      note.className = 'music-note';
      note.textContent = '♪';
      note.style.left = `${e.pageX}px`;
      note.style.top = `${e.pageY}px`;
      document.body.appendChild(note);

      // Ensure cleanup with multiple fallbacks
      note.addEventListener('animationend', () => {
        if (note.parentNode) {
          note.remove();
        }
      });
      
      // Fallback cleanup after animation duration
      setTimeout(() => {
        if (note.parentNode) {
          note.remove();
        }
      }, 600); // Slightly longer than the 0.5s animation
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
};
