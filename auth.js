// auth.js
(function(){
  // Footer year (harmless on pages without #year)
  const YEAR = document.getElementById('year');
  if (YEAR) YEAR.textContent = new Date().getFullYear();

  document.addEventListener('DOMContentLoaded', () => {
    const widget = window.netlifyIdentity;

    // Helper: safely read a user's display name
    function displayName(user){
      if (!user) return '';
      const m = user.user_metadata || {};
      return m.full_name || m.name || user.email || 'Member';
    }

    // ============ LOGIN PAGE ============
    if (document.body.classList.contains('login-page')) {
      const statusEl   = document.getElementById('loginStatus');
      const btnOpen    = document.getElementById('btnOpenWidget');
      const btnMembers = document.getElementById('btnToMembers');

      function setStatus(msg){
        if (statusEl) statusEl.textContent = msg;
      }

      // Buttons
      if (btnOpen) {
        btnOpen.addEventListener('click', () => {
          if (widget && typeof widget.open === 'function') {
            widget.open('login');
          } else {
            setStatus('Authentication service not available. Check your connection and try again.');
            btnOpen.disabled = true;
          }
        });
      }
      if (btnMembers) {
        btnMembers.addEventListener('click', () => {
          window.location.href = 'members.html';
        });
      }

    // Identity lifecycle
if (widget) {
  widget.on('init', user => {
    if (user) {
      // Already logged in
      setStatus(`Logged in as ${displayName(user)}.`);
    } else {
      setStatus('Not logged in.');
    }
  });

  widget.on('login', user => {
    setStatus(`Welcome, ${displayName(user)}. Redirecting…`);
    // Delay slightly to let Netlify Identity set the token before redirect
    setTimeout(() => {
      window.location.href = 'members.html';
    }, 700);
  });

  widget.on('logout', () => {
    setStatus('Logged out.');
  });

  widget.on('error', err => {
    console.error(err);
    setStatus('An authentication error occurred. Please try again.');
  });

  // ✅ Important: this restores login state between page loads
  widget.init({ clearHash: true });
} else {
  setStatus('Authentication service not available. Please refresh or try later.');
  if (btnOpen) btnOpen.disabled = true;
}


    // ============ MEMBERS PAGE ============
    if (document.body.classList.contains('members-page')) {
      const nameEl   = document.getElementById('profName');
      const emailEl  = document.getElementById('profEmail');
      const rolesEl  = document.getElementById('profRoles');
      const guardMsg = document.getElementById('guardMsg');
      const btnLogout= document.getElementById('btnLogout');

      function setGuard(msg){ if (guardMsg) guardMsg.textContent = msg; }

      function updateProfile(user){
        if (!user) return;
        const meta  = user.user_metadata || {};
        const roles = (user.app_metadata && user.app_metadata.roles) || [];
        if (nameEl)  nameEl.textContent  = meta.full_name || meta.name || '—';
        if (emailEl) emailEl.textContent = user.email || '—';
        if (rolesEl) rolesEl.textContent = roles.join(', ') || '—';
      }

      function hasMemberRole(user){
        const roles = (user && user.app_metadata && user.app_metadata.roles) || [];
        return roles.includes('member');
      }

      function guard(){
        const user = widget && widget.currentUser ? widget.currentUser() : null;

        if (!user) {
          // Instead of redirecting, open login popup
          setGuard('Please sign in to continue.');
          widget.open('login');
          return;
        }

        if (!hasMemberRole(user)) {
          setGuard('Your account does not have the required role (member).');
          widget.logout();
          return;
        }

        updateProfile(user);
        setGuard('');
      }

      if (widget) {
        widget.on('init',  () => guard());
        widget.on('login', user => {
          updateProfile(user);
          setGuard('');
        });
        widget.on('logout', () => {
          setGuard('You have been logged out.');
        });
        widget.on('error', err => {
          console.error(err);
          setGuard('Authentication error. Please reload this page.');
        });
        widget.init();
      } else {
        setGuard('Authentication service not available. Please refresh.');
      }

      if (btnLogout) {
        btnLogout.addEventListener('click', () => {
          if (widget && typeof widget.logout === 'function') widget.logout();
        });
      }
    }
  });
})();
