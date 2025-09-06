import { useEffect, useRef } from 'react';

export const usePickBot = (isOnboarding: boolean = false) => {
  const pickbotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pickbotElements = document.querySelectorAll('.pickbot-image');
    
    pickbotElements.forEach(imageElement => {
      // Use existing wrapper if present; otherwise create one
      let wrapper = imageElement.parentElement;
      const parentIsWrapper = wrapper && wrapper.classList && wrapper.classList.contains('pickbot-character');
      if (!parentIsWrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'pickbot-character';
        imageElement.parentNode?.insertBefore(wrapper, imageElement);
        wrapper.appendChild(imageElement);
      }

      // Ensure arms exist exactly once
      const arms = {
        left: wrapper?.querySelector('.pickbot-arm.left') as HTMLElement | null,
        right: wrapper?.querySelector('.pickbot-arm.right') as HTMLElement | null,
      };

      ['left', 'right'].forEach(side => {
        if (!arms[side as keyof typeof arms]) {
          const arm = document.createElement('div');
          arm.classList.add('pickbot-arm', side);
          arm.style.zIndex = '2';
          wrapper?.appendChild(arm);
          arms[side as keyof typeof arms] = arm;
        }
      });

      const positionArms = () => {
        const imageWidthPx = (imageElement as HTMLElement).offsetWidth;
        const imageHeightPx = (imageElement as HTMLElement).offsetHeight;
        if (!imageWidthPx || !imageHeightPx) return;

        // Use responsive sizing but keep our fixed proportions
        const scale = Math.max(0.7, Math.min(1.3, imageWidthPx / 210)); // scale based on ~210px baseline
        const armWidthPx = Math.round(65 * scale);
        const armHeightPx = Math.round(85 * scale);
        const sideOffsetPx = Math.round(22 * scale);

        // Left arm
        if (arms.left) {
          arms.left.style.width = armWidthPx + 'px';
          arms.left.style.height = armHeightPx + 'px';
          arms.left.style.top = '45%';
          arms.left.style.left = `-${sideOffsetPx}px`;
          arms.left.style.right = '';
          arms.left.style.transformOrigin = '80% 18%';
          arms.left.style.transform = 'translateY(-50%)';
        }

        // Right arm
        if (arms.right) {
          arms.right.style.width = armWidthPx + 'px';
          arms.right.style.height = armHeightPx + 'px';
          arms.right.style.top = '45%';
          arms.right.style.right = `-${sideOffsetPx}px`;
          arms.right.style.left = '';
          arms.right.style.transformOrigin = '20% 18%';
          arms.right.style.transform = 'translateY(-50%)';
        }
      };

      const readyPosition = () => {
        positionArms();
        // reflow on viewport changes to keep alignment
        window.addEventListener('resize', positionArms, { passive: true });
        window.addEventListener('orientationchange', positionArms, { passive: true });
      };

      // For div elements, we don't need to wait for load event
      if (imageElement.tagName === 'IMG') {
        if ((imageElement as HTMLImageElement).complete) {
          readyPosition();
        } else {
          imageElement.addEventListener('load', readyPosition, { once: true });
        }
      } else {
        // For div elements, position after a small delay to ensure DOM is ready
        setTimeout(readyPosition, 100);
      }

      // Add gentle waving for onboarding pages on the right arm
      if (isOnboarding && wrapper && arms.right) {
        let direction = 1;
        let angleDeg = 0;
        const maxAngleDeg = 14; // peak rotation
        const stepPerFrameDeg = 1.0; // speed

        const wave = () => {
          angleDeg += direction * stepPerFrameDeg;
          if (angleDeg > maxAngleDeg || angleDeg < -maxAngleDeg) direction *= -1;
          // Preserve vertical centering and add rotation
          if (arms.right) {
            arms.right.style.transform = `translateY(-50%) rotate(${angleDeg}deg)`;
          }
          requestAnimationFrame(wave);
        };

        // Start after first layout to avoid visual jump
        setTimeout(() => requestAnimationFrame(wave), 400);
      }
    });
  }, [isOnboarding]);

  return pickbotRef;
};
