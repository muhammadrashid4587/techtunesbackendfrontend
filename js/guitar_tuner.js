document.addEventListener('DOMContentLoaded', () => {
    const notes      = document.querySelectorAll('.note');
    const strings    = document.querySelectorAll('.string');
    const highlight  = document.getElementById('string-highlight');
    const modeToggle = document.getElementById('modeToggle');
    const modeLabel  = document.querySelector('.mode-switch .label-text');
  
    // Vertical pixel offsets for each string inside .strings
    // Tweak these until the highlight bar sits perfectly on each string.
    const stringOffsets = {
      E2:  0,    // low E
      A:   22,
      D:   44,
      G:   66,
      B:   88,
      E1: 110    // high E
    };
  
    notes.forEach(btn => {
      btn.addEventListener('click', () => {
        // 1) Reset all
        notes.forEach(n => n.classList.remove('active'));
        strings.forEach(s => {
          s.classList.remove('active');
          s.src = s.dataset.unclicked;
        });
        highlight.classList.remove('active');
  
        // 2) Activate chosen note & string
        btn.classList.add('active');
        const target = btn.dataset.string;
        const strEl  = document.querySelector(`.string[data-string="${target}"]`);
        strEl.classList.add('active');
        strEl.src = strEl.dataset.clicked;
  
        // 3) Position & show highlight
        highlight.style.top = `${stringOffsets[target]}px`;
        highlight.classList.add('active');
      });
    });
  
    modeToggle.addEventListener('change', () => {
      modeLabel.textContent = modeToggle.checked ? 'Automatic' : 'Manual';
      // TODO: implement mic/pitch-detect
    });
  });
  