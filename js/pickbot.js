// js/pickbot.js
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.pickbot-image').forEach(img => {
    // 1) wrap the image
    const wrapper = document.createElement('div');
    wrapper.className = 'pickbot-character';
    img.parentNode.insertBefore(wrapper, img);
    wrapper.appendChild(img);

    // 2) inject arms AND legs, one per “side”
    ['left','right'].forEach(side => {
      // ARM
      const arm = document.createElement('div');
      arm.classList.add('pickbot-arm', side);
      wrapper.appendChild(arm);

      // LEG
      const leg = document.createElement('div');
      leg.classList.add('pickbot-leg', side);
      wrapper.appendChild(leg);
    });
  });
});
