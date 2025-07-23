// run on every page that has <nav>
document.addEventListener('DOMContentLoaded', () => {
    const navProfile = document.getElementById('nav-profile');
    const saved = JSON.parse(localStorage.getItem('technoProfile') || '{}');
    if (saved.avatar && saved.avatar.body) {
      // create a 32×32 avatar <img>
      const avatarImg = document.createElement('img');
      avatarImg.src = `images/Background/${saved.avatar.body}`;
      avatarImg.id  = 'nav-avatar';
      avatarImg.style.width = '32px';
      avatarImg.style.height = '32px';
      avatarImg.style.borderRadius = '50%';
      avatarImg.style.marginLeft = '0.5rem';
      // replace the Profile text link
      navProfile.innerHTML = '';
      navProfile.appendChild(avatarImg);
    }
  });
  