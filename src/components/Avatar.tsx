import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePickBot } from '../hooks/usePickBot';
import '../styles/pickbot.css';

const Avatar: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  usePickBot(false);
  const [currentCategory, setCurrentCategory] = useState<string>('');
  const [currentAccessoryFile, setCurrentAccessoryFile] = useState<string | null>(null);
  const [avatarLayers, setAvatarLayers] = useState({
    hands: '',
    eyes: '',
    mouth: '',
    accessories: ''
  });
  const [avatarColor, setAvatarColor] = useState('#ffffff');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const folderMap = { 
    hands: 'Hands', 
    eyes: 'Eyes', 
    mouth: 'Mouth', 
    accessories: 'Accessories' 
  };

  const files = {
    hands: ['Base Hands@4x.png','Bent Hands@4x.png','Down Hands@4x.png','Raise and Bent Hands@4x.png','Up Hands@4x.png'],
    eyes: ['Base Eyes@4x.png','Eyelash Eyes@4x.png','Eyeliner Eyes@4x.png','Half Eyes@4x.png'],
    mouth: ['Base Mouth@4x.png','Half Smile Mouth@4x.png','Lips Mouth@4x.png','Smile Mouth@4x.png','Smirk Mouth@4x.png','Toungue Mouth@4x.png'],
    accessories: ['Beanie@4x.png','Bow@4x.png','Cowboy Hat@4x.png','Crown@4x.png','Hat@4x.png','Party Hat@4x.png','Purse@4x.png','binoculars@4x.png','braids@4x.png','glasses@4x.png','necklace@4x.png','swoop hair@4x.png','tie@4x.png']
  };

  const ACCESSORY_PRESETS = {
    "Beanie@4x.png": { baseBottom: 470, baseWidth: 140, dx: 28, dy: 0, scale: 1.00 },
    "binoculars@4x.png": { baseBottom: 355, baseWidth: 120, dx: 8, dy: -6, scale: 1.00 },
    "Bow@4x.png": { baseBottom: 472, baseWidth: 120, dx: 22, dy: -2, scale: 1.00 },
    "braids@4x.png": { baseBottom: 452, baseWidth: 130, dx: 0, dy: 10, scale: 1.00 },
    "Cowboy Hat@4x.png": { baseBottom: 470, baseWidth: 150, dx: 8, dy: 0, scale: 1.00 },
    "Crown@4x.png": { baseBottom: 485, baseWidth: 120, dx: 0, dy: 0, scale: 1.00 },
    "glasses@4x.png": { baseBottom: 355, baseWidth: 110, dx: 0, dy: 0, scale: 1.00 },
    "Hat@4x.png": { baseBottom: 465, baseWidth: 140, dx: 26, dy: -6, scale: 1.00 },
    "necklace@4x.png": { baseBottom: 250, baseWidth: 120, dx: 0, dy: -28, scale: 1.00 },
    "Party Hat@4x.png": { baseBottom: 475, baseWidth: 120, dx: 15, dy: 0, scale: 1.00 },
    "Purse@4x.png": { baseBottom: 190, baseWidth: 120, dx: 56, dy: -34, scale: 0.95 },
    "swoop hair@4x.png": { baseBottom: 462, baseWidth: 140, dx: -10, dy: 0, scale: 1.00 },
    "tie@4x.png": { baseBottom: 235, baseWidth: 70, dx: 0, dy: -12, scale: 1.00 }
  };

  const [, setAccessoryAdjustments] = useState<{[key: string]: any}>({});

  useEffect(() => {
    // Load saved accessory adjustments
    try {
      const saved = localStorage.getItem('accessory_adjustments');
      if (saved) {
        setAccessoryAdjustments(JSON.parse(saved));
      }
    } catch (e) {
      console.log('No saved accessory adjustments');
    }
  }, []);

  const getAccessoryAdjustments = () => {
    try {
      return JSON.parse(localStorage.getItem('accessory_adjustments') || '{}');
    } catch {
      return {};
    }
  };

  const mergedAccessoryAdj = (fileName: string) => {
    const preset = ACCESSORY_PRESETS[fileName as keyof typeof ACCESSORY_PRESETS] || { baseBottom: 360, baseWidth: 120, dx: 0, dy: 0, scale: 1 };
    const saved = getAccessoryAdjustments()[fileName] || {};
    return { ...preset, ...saved };
  };

  const applyAccessoryAdjustments = (fileName: string) => {
    const adj = mergedAccessoryAdj(fileName);
    return {
      bottom: `${adj.baseBottom}px`,
      width: `${adj.baseWidth}px`,
      transform: `translateX(-50%) translate(${adj.dx}px, ${adj.dy}px) scale(${adj.scale})`
    };
  };

  const setOption = (category: string) => {
    setCurrentCategory(category);
  };

  const selectLayer = (category: string, fileName: string) => {
    const imagePath = `/images/Choice Elements/${folderMap[category as keyof typeof folderMap]}/${fileName}`;
    setAvatarLayers(prev => ({
      ...prev,
      [category]: imagePath
    }));

    if (category === 'accessories') {
      setCurrentAccessoryFile(fileName);
    }
  };

  const resetAvatar = () => {
    setAvatarLayers({
      hands: '',
      eyes: '',
      mouth: '',
      accessories: ''
    });
    setAvatarColor('#ffffff');
    setCurrentAccessoryFile(null);
  };

  const saveAvatar = async () => {
    try {
      // Create a canvas to capture the avatar
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 450;
      canvas.height = 1100;

      // Draw background
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw avatar base
      ctx.fillStyle = avatarColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw layers
      const layers = [
        { src: avatarLayers.hands, y: 300 },
        { src: avatarLayers.eyes, y: 330 },
        { src: avatarLayers.mouth, y: 280 },
        { src: avatarLayers.accessories, y: 360 }
      ];

      for (const layer of layers) {
        if (layer.src) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, 0, layer.y, canvas.width, 200);
              resolve(true);
            };
            img.src = layer.src;
          });
        }
      }

      const dataUrl = canvas.toDataURL('image/png');
      localStorage.setItem('savedAvatar', dataUrl);
      localStorage.setItem('technoProfile', JSON.stringify({
        avatar: {
          body: dataUrl,
          color: avatarColor,
          layers: avatarLayers
        }
      }));

      navigate('/profile.html');
    } catch (error) {
      console.error('Error saving avatar:', error);
    }
  };

  const handleAccessoryDrag = (e: React.PointerEvent) => {
    if (!currentAccessoryFile || !avatarLayers.accessories) return;

    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    setDragOffset({
      x: e.clientX - centerX,
      y: e.clientY - centerY
    });
  };

  const handleAccessoryMove = (e: React.PointerEvent) => {
    if (!isDragging || !currentAccessoryFile) return;

    const mirror = document.querySelector('.mirror') as HTMLElement;
    if (!mirror) return;

    const mirrorRect = mirror.getBoundingClientRect();
    const centerX = (e.clientX - mirrorRect.left - mirrorRect.width / 2) - dragOffset.x;
    const centerY = (e.clientY - mirrorRect.top - mirrorRect.height / 2) - dragOffset.y;

    const store = getAccessoryAdjustments();
    const adj = mergedAccessoryAdj(currentAccessoryFile);

    store[currentAccessoryFile] = {
      dx: centerX / (adj.scale || 1),
      dy: centerY / (adj.scale || 1),
      scale: adj.scale || 1
    };

    localStorage.setItem('accessory_adjustments', JSON.stringify(store));
    setAccessoryAdjustments(store);
  };

  const handleAccessoryEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!currentAccessoryFile) return;
    e.preventDefault();

    const store = getAccessoryAdjustments();
    const adj = mergedAccessoryAdj(currentAccessoryFile);
    let scale = adj.scale || 1;
    scale = Math.max(0.5, Math.min(2.0, +(scale * (e.deltaY < 0 ? 1.05 : 0.95)).toFixed(3)));

    store[currentAccessoryFile] = { 
      dx: adj.dx || 0, 
      dy: adj.dy || 0, 
      scale 
    };

    localStorage.setItem('accessory_adjustments', JSON.stringify(store));
    setAccessoryAdjustments(store);
  };

  // Color wheel functionality
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = ["#ff0000","#00ff00","#0000ff","#ffff00","#ff00ff","#00ffff","#ff8000","#8000ff","#ffffff"];
    let startAngle = 0;
    const arc = (2 * Math.PI) / colors.length;

    const drawWheel = () => {
      ctx.clearRect(0, 0, 300, 300);
      for (let i = 0; i < colors.length; i++) {
        ctx.beginPath();
        ctx.fillStyle = colors[i];
        ctx.moveTo(150, 150);
        ctx.arc(150, 150, 150, startAngle + i * arc, startAngle + (i + 1) * arc);
        ctx.fill();
        ctx.stroke();
      }
    };

    drawWheel();
  }, []);

  const spinColorWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = ["#ff0000","#00ff00","#0000ff","#ffff00","#ff00ff","#00ffff","#ff8000","#8000ff","#ffffff"];
    const arc = (2 * Math.PI) / colors.length;
    const TAU = Math.PI * 2;
    const POINTER_ANGLE = -Math.PI / 2;

    let startAngle = 0;
    let spinAngle = 0;
    let spinVelocity = Math.random() * 20 + 10;
    let spinning = true;

    const spin = () => {
      if (spinning) {
        spinAngle += spinVelocity;
        spinVelocity *= 0.98;
        if (spinVelocity < 0.01) spinning = false;
        startAngle += spinAngle * Math.PI / 180;
        ctx.clearRect(0, 0, 300, 300);
        
        for (let i = 0; i < colors.length; i++) {
          ctx.beginPath();
          ctx.fillStyle = colors[i];
          ctx.moveTo(150, 150);
          ctx.arc(150, 150, 150, startAngle + i * arc, startAngle + (i + 1) * arc);
          ctx.fill();
          ctx.stroke();
        }
        
        requestAnimationFrame(spin);
      } else {
        const rel = ((POINTER_ANGLE - startAngle) % TAU + TAU) % TAU;
        const selectedIndex = Math.floor(rel / arc);
        const selectedColor = colors[selectedIndex];
        setAvatarColor(selectedColor);
      }
    };

    spin();
  };

  return (
    <div style={{
      margin: 0,
      fontFamily: "'Poppins', sans-serif",
      background: 'url(/images/Brick_Wall.png) center/cover no-repeat',
      backgroundAttachment: 'fixed',
      overflow: 'hidden',
      height: '100vh'
    }}>
      <img src="/images/Floor.png" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100vw',
        height: 'auto',
        zIndex: 0
      }} alt="floor" />

      <div style={{
        position: 'relative',
        display: 'flex',
        width: '100vw',
        height: '100vh'
      }}>
        {/* Left Panel - Mirror */}
        <div style={{ width: '50%', position: 'relative', display: 'block' }}>
          <div className="mirror" style={{
            position: 'relative',
            bottom: '150px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '450px',
            height: '1100px',
            background: 'url(/images/Background/mirror.png) center/contain no-repeat',
            zIndex: 1
          }}>
            <div style={{
              position: 'absolute',
              top: '-200px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '500px',
              height: '800px',
              background: 'url(/images/Background/Lamp Dressing Room@4x.png) center/contain no-repeat',
              zIndex: 2
            }}></div>
            
            <div style={{
              position: 'absolute',
              bottom: '-20px',
              left: '57%',
              transform: 'translateX(-50%)',
              width: '200px',
              height: '325px',
              background: 'url(/images/Background/Stand@4x.png) center/contain no-repeat',
              zIndex: 2
            }}></div>

            {/* Avatar Base */}
            <div id="avatar-base" className="pickbot-image" style={{
              position: 'absolute',
              bottom: '200px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '220px',
              height: '300px',
              zIndex: 4,
              backgroundColor: avatarColor,

              maskRepeat: 'no-repeat',
              maskPosition: 'center',
              maskSize: 'contain',
              WebkitMaskImage: 'url(/images/ogbot.png)',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              WebkitMaskSize: 'contain'
            }}></div>

            {/* Avatar Layers */}
            <img 
              id="layer-hands" 
              className="avatar-layer" 
              src={avatarLayers.hands} 
              alt=""
              style={{
                position: 'absolute',
                bottom: '300px',
                left: '50%',
                transform: 'translateX(-50%) scaleX(1.2)',
                width: '180px',
                zIndex: 5
              }}
            />
            
            <img 
              id="layer-eyes" 
              className="avatar-layer" 
              src={avatarLayers.eyes} 
              alt=""
              style={{
                position: 'absolute',
                bottom: '330px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '80px',
                zIndex: 6
              }}
            />
            
            <img 
              id="layer-mouth" 
              className="avatar-layer" 
              src={avatarLayers.mouth} 
              alt=""
              style={{
                position: 'absolute',
                bottom: '280px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60px',
                zIndex: 7
              }}
            />
            
            <img 
              id="layer-accessories" 
              className="avatar-layer" 
              src={avatarLayers.accessories} 
              alt=""
              style={{
                position: 'absolute',
                bottom: '360px',
                left: '50%',
                width: '120px',
                zIndex: 8,
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                pointerEvents: 'auto',
                touchAction: 'none',
                ...(currentAccessoryFile ? applyAccessoryAdjustments(currentAccessoryFile) : {})
              }}
              onPointerDown={handleAccessoryDrag}
              onPointerMove={handleAccessoryMove}
              onPointerUp={handleAccessoryEnd}
              onPointerCancel={handleAccessoryEnd}
              onWheel={handleWheel}
            />
          </div>
        </div>

        {/* Right Panel - Controls */}
        <div style={{ 
          width: '50%', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          paddingTop: '30px' 
        }}>
          {/* Color Wheel */}
          <div style={{ textAlign: 'center', margin: '20px' }}>
            <div style={{
              position: 'relative',
              width: '300px',
              height: '300px',
              margin: '0 auto'
            }}>
              <canvas 
                ref={canvasRef}
                width="300" 
                height="300"
                style={{ borderRadius: '50%' }}
              />
              <div style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                top: '-12px',
                width: 0,
                height: 0,
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                borderBottom: '24px solid #fff',
                zIndex: 5,
                filter: 'drop-shadow(0 2px 0 rgba(0,0,0,.35))'
              }}></div>
            </div>
            <button 
              onClick={spinColorWheel}
              style={{
                marginTop: '15px',
                padding: '10px 20px',
                background: '#4DB8FF',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Spin
            </button>
          </div>

          {/* Options Box */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            justifyContent: 'center',
            margin: '15px 0'
          }}>
            {currentCategory && files[currentCategory as keyof typeof files].map(file => (
              <img
                key={file}
                src={`/images/Choice Elements/${folderMap[currentCategory as keyof typeof folderMap]}/${file}`}
                alt={file}
                style={{
                  width: '60px',
                  height: '60px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  transition: 'transform .2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onClick={() => selectLayer(currentCategory, file)}
              />
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
            <img 
              src="/images/Background/Hands Button@4x.png" 
              onClick={() => setOption('hands')} 
              alt="Hands"
              style={{ width: '60px', height: 'auto', cursor: 'pointer' }}
            />
            <img 
              src="/images/Background/Eyes Button@4x.png" 
              onClick={() => setOption('eyes')} 
              alt="Eyes"
              style={{ width: '60px', height: 'auto', cursor: 'pointer' }}
            />
            <img 
              src="/images/Background/Mouth Button@4x.png" 
              onClick={() => setOption('mouth')} 
              alt="Mouth"
              style={{ width: '60px', height: 'auto', cursor: 'pointer' }}
            />
            <img 
              src="/images/Background/Accessory Button@4x.png" 
              onClick={() => setOption('accessories')} 
              alt="Accessories"
              style={{ width: '60px', height: 'auto', cursor: 'pointer' }}
            />
          </div>

          {/* Action Buttons */}
          <button 
            onClick={resetAvatar}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              background: '#4DB8FF',
              color: '#fff',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'background .2s'
            }}
          >
            Reset
          </button>
          
          <button 
            onClick={saveAvatar}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              background: '#4DB8FF',
              color: '#fff',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'background .2s'
            }}
          >
            Save & Return
          </button>
        </div>
      </div>
    </div>
  );
};

export default Avatar;