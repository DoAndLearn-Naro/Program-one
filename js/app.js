(() => {
  const tabBtns = Array.from(document.querySelectorAll('.tab-btn'));
  const panels = {
    board: document.getElementById('panel-board'),
    exercise: document.getElementById('panel-exercise'),
    room: document.getElementById('panel-room')
  };
  const toast = document.getElementById('toast');

  const switchTab = (name) => {
    tabBtns.forEach((btn) => {
      const active = btn.dataset.tab === name;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active);
    });
    Object.entries(panels).forEach(([k, el]) => {
      const active = k === name;
      el.classList.toggle('active', active);
      el.hidden = !active;
    });
    Store.savePrefs({ lastTab: name });
  };

  tabBtns.forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

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
  switchTab(prefs.lastTab || 'board');
})();