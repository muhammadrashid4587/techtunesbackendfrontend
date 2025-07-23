// // js/login.js
// document.addEventListener('DOMContentLoaded', () => {
//     const form = document.getElementById('login-form');
//     const user = document.getElementById('login-user');
//     const pass = document.getElementById('login-pass');
  
//     form.addEventListener('submit', e => {
//       e.preventDefault();
  
//       // Simple front-end “auth” simulation:
//       const username = user.value.trim();
//       const password = pass.value;
  
//       if (!username || !password) {
//         alert('Please fill in both fields.');
//         return;
//       }
  
//       // Save to localStorage as “logged in”
//       localStorage.setItem('technoUser', JSON.stringify({ username }));
      
//       alert(`Welcome, ${username}!`);
//       // Redirect home (or wherever)
//       window.location.href = '/index.html';
//     });
//   });
  


document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const user = document.getElementById('login-user');
  const pass = document.getElementById('login-pass');

  form.addEventListener('submit', e => {
    e.preventDefault();

    const username = user.value.trim();
    const password = pass.value;
    if (!username || !password) {
      alert('Please fill in both fields.');
      return;
    }

    // pull plan & next page from URL params
    const params   = new URLSearchParams(window.location.search);
    const plan     = params.get('plan') || 'free';
    const nextPage = params.get('next') || 'index.html';

    // save user + plan in localStorage
    localStorage.setItem(
      'technoUser',
      JSON.stringify({ username, plan })
    );

    alert(`Welcome, ${username}!`);
    // redirect into onboarding (reg1.html) or fallback
    window.location.href = nextPage;
  });
});
