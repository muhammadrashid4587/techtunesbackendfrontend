// document.addEventListener('DOMContentLoaded', () => {
//   const form       = document.getElementById('profile-form');
//   const nameInput  = document.getElementById('profile-name');
//   const instSelect = document.getElementById('favorite-instrument');
//   const colorInput = document.getElementById('avatar-color');
//   const greetEl    = document.getElementById('greeting');
//   const instEl     = document.getElementById('instrument-display');

//   // avatar layers config
//   const layers = {
//     stand: { el: 'avatar-stand',  path: 'images/Background/' },
//     body:  { el: 'avatar-body',   path: 'images/Background/' },
//     hands: { el: 'avatar-hands',  path: 'images/Choice Elements/Hands/' },
//     eyes:  { el: 'avatar-eyes',   path: 'images/Choice Elements/Eyes/' },
//     mouth: { el: 'avatar-mouth',  path: 'images/Choice Elements/Mouth/' },
//     acc:   { el: 'avatar-acc',    path: 'images/Choice Elements/Accessories/' },
//   };

//   // load saved profile + avatar config
//   function loadProfile() {
//     const saved = JSON.parse(localStorage.getItem('technoProfile') || '{}');
//     if (saved.name)  nameInput.value = saved.name;
//     if (saved.inst)  instSelect.value = saved.inst;
//     if (saved.color) colorInput.value = saved.color;
//     // avatar pieces
//     if (saved.avatar) {
//       Object.entries(saved.avatar).forEach(([key, file]) => {
//         const img = document.getElementById(layers[key].el);
//         if (img) img.src = layers[key].path + file;
//         const sel = document.getElementById(`sel-${key}`);
//         if (sel) sel.value = file;
//       });
//     }
//     updatePreview();
//   }

//   // reflect name / inst / color
//   function updatePreview() {
//     greetEl.textContent = `Hello, ${nameInput.value || 'Your Name'}!`;
//     instEl.textContent = instSelect.value ? `Loves playing ${instSelect.value}` : '';
//   }

//   // persist everything
//   function saveProfile() {
//     const avatar = {};
//     Object.keys(layers).forEach(key => {
//       const sel = document.getElementById(`sel-${key}`);
//       if (sel) avatar[key] = sel.value;
//     });
//     const profile = {
//       name:  nameInput.value.trim(),
//       inst:  instSelect.value,
//       color: colorInput.value,
//       avatar
//     };
//     localStorage.setItem('technoProfile', JSON.stringify(profile));
//   }

//   // bind avatar selectors
//   function bindLayer(selId, key) {
//     document.getElementById(selId).addEventListener('change', e => {
//       const img = document.getElementById(layers[key].el);
//       img.src = layers[key].path + e.target.value;
//     });
//   }
//   bindLayer('sel-body',  'body');
//   bindLayer('sel-hands', 'hands');
//   bindLayer('sel-eyes',  'eyes');
//   bindLayer('sel-mouth', 'mouth');
//   bindLayer('sel-acc',   'acc');

//   // animate idle with Anime.js
//   const idle = anime.timeline({ loop: true, direction: 'alternate' });
//   idle
//     .add({ targets: '#avatar-body', scale: [1,1.03], translateY: [0,-8], duration:3000, easing:'easeInOutSine' }, 0)
//     .add({ targets: '#avatar-hands', rotate: [-5,5], duration:2500, easing:'easeInOutSine' }, 0)
//     .add({ targets: '#avatar-eyes', opacity: [1,0,1], duration:4000, easing:'linear' }, 1000);

//   // form handlers
//   form.addEventListener('submit', e => {
//     e.preventDefault();
//     saveProfile();
//     alert('Profile & avatar saved!');
//   });

//   // initial load
//   loadProfile();
// });




document.addEventListener('DOMContentLoaded', () => {
  const form       = document.getElementById('profile-form');
  const nameInput  = document.getElementById('profile-name');
  const instSelect = document.getElementById('favorite-instrument');
  const colorInput = document.getElementById('avatar-color');
  const greetEl    = document.getElementById('greeting');
  const instEl     = document.getElementById('instrument-display');

  // avatar layer config
  const layers = {
    body:  { el: 'avatar-body',  path: 'images/Avatar/' },
    hands: { el: 'avatar-hands', path: 'images/Choice Elements/Hands/' },
    eyes:  { el: 'avatar-eyes',  path: 'images/Choice Elements/Eyes/' },
    mouth: { el: 'avatar-mouth', path: 'images/Choice Elements/Mouth/' },
    acc:   { el: 'avatar-acc',   path: 'images/Choice Elements/Accessories/' },
  };

  function loadProfile() {
    const saved = JSON.parse(localStorage.getItem('technoProfile') || '{}');
    if (saved.name)  nameInput.value = saved.name;
    if (saved.inst)  instSelect.value = saved.inst;
    if (saved.color) colorInput.value = saved.color;

    // restore avatar layers
    if (saved.avatar) {
      Object.keys(layers).forEach(key => {
        const file = saved.avatar[key];
        const img  = document.getElementById(layers[key].el);
        const sel  = document.getElementById(`sel-${key}`);
        if (file && img) {
          img.src = layers[key].path + file;
        }
        if (file && sel) {
          sel.value = file;
        }
      });
    }

    updatePreview();
  }

  function updatePreview() {
    greetEl.textContent = `Hello, ${nameInput.value || 'Your Name'}!`;
    instEl.textContent  = instSelect.value ? `Loves playing ${instSelect.value}` : '';
  }

  function saveProfile() {
    // gather avatar choices
    const avatarConfig = {};
    Object.keys(layers).forEach(key => {
      const sel = document.getElementById(`sel-${key}`);
      if (sel) avatarConfig[key] = sel.value;
    });

    const profile = {
      name:   nameInput.value.trim(),
      inst:   instSelect.value,
      color:  colorInput.value,
      avatar: avatarConfig
    };
    localStorage.setItem('technoProfile', JSON.stringify(profile));
    alert('Profile & avatar saved!');
  }

  // bind dropdowns to swap layers
  Object.keys(layers).forEach(key => {
    const sel = document.getElementById(`sel-${key}`);
    if (!sel) return;
    sel.addEventListener('change', e => {
      document.getElementById(layers[key].el).src =
        layers[key].path + e.target.value;
    });
  });

  // idle animation: breathe, sway, blink
  const idle = anime.timeline({ loop: true, direction: 'alternate' });
  idle
    .add({
      targets: '#avatar-body',
      scale: [1, 1.03],
      translateY: [0, -8],
      duration: 3000,
      easing: 'easeInOutSine'
    }, 0)
    .add({
      targets: '#avatar-hands',
      rotate: [-5, 5],
      duration: 2500,
      easing: 'easeInOutSine'
    }, 0)
    .add({
      targets: '#avatar-eyes',
      opacity: [1, 0, 1],
      duration: 4000,
      easing: 'linear'
    }, 1000);

  form.addEventListener('submit', e => {
    e.preventDefault();
    saveProfile();
  });

  loadProfile();
});
