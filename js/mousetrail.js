document.addEventListener('mousemove', e => {
    const note = document.createElement('div');
    note.className = 'music-note';
    note.textContent = '♪';            // or “♫” / inline SVG
    note.style.left = `${e.pageX}px`;
    note.style.top  = `${e.pageY}px`;
    document.body.appendChild(note);
  
    note.addEventListener('animationend', () => note.remove());
  });
  