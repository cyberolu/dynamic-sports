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
            setStatus(`Logged in as ${displayName(user)}.`);
          } else {
            setStatus('Not logged in.');
          }
        });

        widget.on('login', user => {
          setStatus(`Welcome, ${displayName(user)}. Redirecting…`);
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

        // ✅ Restore login state between sessions
        widget.init({ clearHash: true });
      } else {
        setStatus('Authentication service not available. Please refresh or try later.');
        if (btnOpen) btnOpen.disabled = true;
      }
    } // <-- closes login-page block

    // ============ MEMBERS PAGE ============
    if (document.body.classList.contains('members-page')) {
      const nameEl = document.getElementById('profName');
      const emailEl = document.getElementById('profEmail');
      const rolesEl = document.getElementById('profRoles');
      const guardMsg = document.getElementById('guardMsg');
      const btnLogout = document.getElementById('btnLogout');

      function setGuard(msg, showLoginBtn = false) {
        if (guardMsg) {
          guardMsg.innerHTML = msg;
          if (showLoginBtn) {
            guardMsg.innerHTML +=
              `<br><button id="loginNow" class="btn" style="margin-top:.5rem;">Log in</button>`;
            const btn = document.getElementById('loginNow');
            if (btn) btn.addEventListener('click', () => widget.open('login'));
          }
        }
      }

      function updateProfile(user) {
        if (!user) return;
        const meta = user.user_metadata || {};
        const roles = (user.app_metadata && user.app_metadata.roles) || [];
        if (nameEl) nameEl.textContent = meta.full_name || meta.name || '—';
        if (emailEl) emailEl.textContent = user.email || '—';
        if (rolesEl) rolesEl.textContent = roles.join(', ') || '—';
      }

      function guard() {
        const user = widget && widget.currentUser ? widget.currentUser() : null;
        if (!user) {
          setGuard('You are not logged in. Please sign in to continue.', true);
          return;
        }
        updateProfile(user);
        setGuard('');
      }

      if (widget) {
        widget.on('init', () => guard());
        widget.on('login', () => guard());
        widget.on('logout', () => {
          setGuard('You have been logged out.', true);
        });
        widget.on('error', err => {
          console.error(err);
          setGuard('Authentication error. Please reload this page.');
        });
        widget.init({ clearHash: true });
      } else {
        setGuard('Authentication service unavailable. Please refresh and try again.', true);
      }

      if (btnLogout) {
        btnLogout.addEventListener('click', () => {
          if (widget && typeof widget.logout === 'function') widget.logout();
          else window.location.href = 'login.html';
        });
      }
    }
  });
})();
