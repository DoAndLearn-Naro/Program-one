(() => {
  const panels = {
    hub:      document.getElementById('panel-hub'),
    board:    document.getElementById('panel-board'),
    exercise: document.getElementById('panel-exercise'),
    room:     document.getElementById('panel-room')
  };
  const toast = document.getElementById('toast');

  const goTo = (view) => {
    Object.entries(panels).forEach(([k, el]) => {
      const active = k === view;
      el.classList.toggle('active', active);
      el.hidden = !active;
    });
    document.body.classList.toggle('in-room', view === 'room');
    Store.savePrefs({ lastView: view });
  };

  document.querySelectorAll('.hub-card').forEach((card) => {
    card.addEventListener('click', () => goTo(card.dataset.view));
  });

  document.querySelectorAll('[data-go]').forEach((el) => {
    el.addEventListener('click', () => goTo(el.dataset.go));
  });

  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  };
  window.AppToast = { showToast };

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => showToast('離線快取註冊失敗'));
    });
  }

  const prefs = Store.loadPrefs();
  goTo(prefs.lastView || 'hub');
})();