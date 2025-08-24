// js/pickbot.js
document.addEventListener('DOMContentLoaded', () => {
  const isOnboarding = /\breg[0-9]*\.html$/i.test(window.location.pathname) ||
                       document.body.dataset.onboarding === 'true' ||
                       document.body.classList.contains('onboarding');

  document.querySelectorAll('.pickbot-image').forEach(imageElement => {
    // Wrap image
    const wrapper = document.createElement('div');
    wrapper.className = 'pickbot-character';
    imageElement.parentNode.insertBefore(wrapper, imageElement);
    wrapper.appendChild(imageElement);

    // Inject arms and legs
    const arms = {};
    ['left', 'right'].forEach(side => {
      const arm = document.createElement('div');
      arm.classList.add('pickbot-arm', side);
      wrapper.appendChild(arm);
      arms[side] = arm;

      const leg = document.createElement('div');
      leg.classList.add('pickbot-leg', side);
      wrapper.appendChild(leg);
    });

    function positionArms() {
      const imgW = imageElement.offsetWidth;
      const imgH = imageElement.offsetHeight;
      const armSize = Math.max(72, Math.min(220, Math.round(imgW * 0.80)));
      const centerTopPx = Math.round(imgH * 0.41); // slightly above mid-height
      const anchorOffset = Math.round(armSize * 0.000001); // align shoulder (20%) to edge

      // Left arm
      if (arms.left) {
        arms.left.style.width = armSize + 'px';
        arms.left.style.height = armSize + 'px';
        arms.left.style.top = centerTopPx + 'px';
        arms.left.style.left = '-' + anchorOffset + 'px';
        arms.left.style.right = '';
        arms.left.style.transform = 'translateY(-50%)';
      }
      // Right arm (mirrored)
      if (arms.right) {
        arms.right.style.width = armSize + 'px';
        arms.right.style.height = armSize + 'px';
        arms.right.style.top = centerTopPx + 'px';
        arms.right.style.right = '-' + anchorOffset + 'px';
        arms.right.style.left = '';
        arms.right.style.transform = 'translateY(-50%) scaleX(-1)';
      }
    }

    function readyPosition() {
      positionArms();
      // also reflow on resize to keep alignment
      window.addEventListener('resize', positionArms, { passive: true });
    }

    if (imageElement.complete) {
      readyPosition();
    } else {
      imageElement.addEventListener('load', readyPosition, { once: true });
    }

    // Enable waving on onboarding pages (rotate around top-left shoulder)
    if (isOnboarding && arms.right) {
      let dir = 1;
      let angle = 0;
      const maxAngle = 16; // degrees
      const step = 1.2;    // speed
      function wave() {
        angle += dir * step;
        if (angle > maxAngle || angle < -maxAngle) dir *= -1;
        // keep horizontal flip and vertical alignment
        arms.right.style.transform = `translateY(-50%) scaleX(-1) rotate(${angle}deg)`;
        requestAnimationFrame(wave);
      }
      // start after first layout to avoid jump
      setTimeout(() => requestAnimationFrame(wave), 500);
    }
  });
});
