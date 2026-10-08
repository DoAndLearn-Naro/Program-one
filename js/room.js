const Room = (() => {
  const roomArea       = document.getElementById('room-area');
  const inventoryRow   = document.getElementById('inventory-row');
  const catTabsEl      = document.getElementById('cat-tabs');
  const bgPickerEl     = document.getElementById('bg-picker');
  const selectionMenu  = document.getElementById('selection-menu');
  const resetBtn       = document.getElementById('room-reset');
  const itemUploadEl   = document.getElementById('item-upload');
  const customClearBtn = document.getElementById('custom-clear');

  const BUILTIN = [
    { type: 'sofa',     label: '沙發', emoji: '🛋️', category: 'furniture', width: 150, height: 100, iconSize: '5rem' },
    { type: 'plant',    label: '盆栽', emoji: '🪴', category: 'plant',     width: 90,  height: 110, iconSize: '4.5rem' },
    { type: 'cat',      label: '貓咪', emoji: '🐈', category: 'animal',    width: 80,  height: 80,  iconSize: '3.5rem' },
    { type: 'painting', label: '畫作', emoji: '🖼️', category: 'decor',     width: 110, height: 130, iconSize: '4.5rem' },
    { type: 'lamp',     label: '立燈', emoji: '💡', category: 'furniture', width: 60,  height: 140, iconSize: '4rem' },
    { type: 'gift',     label: '禮物', emoji: '🎁', category: 'decor',     width: 80,  height: 80,  iconSize: '3.5rem' },
    { type: 'bed',      label: '床',   emoji: '🛏️', category: 'furniture', width: 170, height: 110, iconSize: '5rem' },
    { type: 'book',     label: '書本', emoji: '📚', category: 'decor',     width: 80,  height: 70,  iconSize: '3rem' },
    { type: 'photo',    label: '相框', emoji: '🖼️', category: 'decor',     width: 80,  height: 100, iconSize: '3.5rem' },
    { type: 'flower',   label: '花瓶', emoji: '🌷', category: 'plant',     width: 60,  height: 100, iconSize: '3.5rem' },
    { type: 'clock',    label: '時鐘', emoji: '🕰️', category: 'furniture', width: 70,  height: 90,  iconSize: '3.5rem' },
    { type: 'tea',      label: '茶壺', emoji: '🫖', category: 'furniture', width: 70,  height: 80,  iconSize: '3.5rem' }
  ];

  const CATEGORIES = [
    { id: 'all',       label: '全部' },
    { id: 'furniture', label: '家具' },
    { id: 'plant',     label: '植物' },
    { id: 'decor',     label: '裝飾' },
    { id: 'animal',    label: '動物' },
    { id: 'custom',    label: '我的素材' }
  ];

  const BACKGROUNDS = [
    { id: 'default', label: '客廳', css: 'linear-gradient(to bottom, #dbeafe 0%, #dbeafe 65%, #d1d5db 65%, #9ca3af 100%)', floor: true },
    { id: 'bedroom', label: '臥室', css: 'linear-gradient(to bottom, #fce7f3 0%, #fce7f3 65%, #d4b896 65%, #8b6f47 100%)', floor: true },
    { id: 'garden',  label: '花園', css: 'linear-gradient(to bottom, #87ceeb 0%, #87ceeb 65%, #90ee90 65%, #228b22 100%)', floor: false },
    { id: 'beach',   label: '海邊', css: 'linear-gradient(to bottom, #b0e0e6 0%, #87ceeb 40%, #f5deb3 40%, #daa520 100%)', floor: false },
    { id: 'night',   label: '夜晚', css: 'linear-gradient(to bottom, #0f172a 0%, #1e293b 65%, #334155 65%, #1e293b 100%)', floor: true }
  ];

  const SCALE_MIN = 0.4;
  const SCALE_MAX = 3.0;
  const SCALE_STEP = 0.15;

  let state = Store.loadRoom();
  let metaCache = new Map();
  let selectedId = null;
  let activeCategory = state.activeCategory || 'all';
  let dragInfo = null;
  const activePointers = new Map();
  let pinchStartDist = 0;
  let pinchStartItemScale = 1;

  const updateMetaCache = () => {
    metaCache = new Map();
    BUILTIN.forEach((b) => metaCache.set(b.type, b));
    state.customItems.forEach((c) => {
      metaCache.set(c.id, { ...c, category: 'custom', emoji: null });
    });
  };

  const persist = () => {
    state.activeCategory = activeCategory;
    Store.saveRoom(state);
  };

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const getMeta = (type) => metaCache.get(type) || null;

  const clampToRoom = (el, nx, ny) => {
    const roomRect = roomArea.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const w = elRect.width || 60;
    const h = elRect.height || 60;
    const minX = 0, minY = 0;
    const maxX = Math.max(0, roomRect.width - w);
    const maxY = Math.max(0, roomRect.height - h);
    return {
      x: Math.min(Math.max(nx, minX), maxX),
      y: Math.min(Math.max(ny, minY), maxY)
    };
  };

  const renderBgPicker = () => {
    bgPickerEl.innerHTML = '';
    BACKGROUNDS.forEach((bg) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bg-tile';
      btn.dataset.bg = bg.id;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-label', `背景：${bg.label}`);
      btn.style.backgroundImage = bg.css;
      const span = document.createElement('span');
      span.textContent = bg.label;
      btn.append(span);
      btn.addEventListener('click', () => setBackground({ type: 'preset', value: bg.id }));
      bgPickerEl.append(btn);
    });

    const colorBtn = document.createElement('label');
    colorBtn.className = 'bg-tile bg-custom';
    colorBtn.innerHTML = '<span>色</span><input type="color" id="bg-color-input" />';
    colorBtn.querySelector('input').addEventListener('input', (e) => {
      setBackground({ type: 'color', value: e.target.value });
    });
    bgPickerEl.append(colorBtn);

    const imgBtn = document.createElement('label');
    imgBtn.className = 'bg-tile bg-custom';
    imgBtn.innerHTML = '<span>圖</span><input type="file" id="bg-image-input" accept="image/*" hidden />';
    imgBtn.querySelector('input').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (file.size > 1024 * 1024) {
        alert('圖片太大（超過 1 MB），請換小張的');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setBackground({ type: 'image', value: reader.result });
      reader.readAsDataURL(file);
    });
    bgPickerEl.append(imgBtn);
  };

  const updateBgPickerActive = () => {
    const bg = state.background;
    bgPickerEl.querySelectorAll('.bg-tile').forEach((el) => {
      const isPresetMatch = bg.type === 'preset' && el.dataset.bg === bg.value;
      el.classList.toggle('active', isPresetMatch);
      el.setAttribute('aria-checked', String(isPresetMatch));
    });
  };

  const setBackground = (bg) => {
    state.background = bg;
    applyBackground();
    updateBgPickerActive();
    persist();
  };

  const applyBackground = () => {
    const bg = state.background;
    roomArea.classList.remove('bg-default', 'bg-bedroom', 'bg-garden', 'bg-beach', 'bg-night');
    roomArea.classList.remove('bg-floor', 'no-floor');
    roomArea.style.backgroundImage = '';
    roomArea.style.backgroundColor = '';

    if (bg.type === 'preset') {
      const preset = BACKGROUNDS.find((b) => b.id === bg.value) || BACKGROUNDS[0];
      roomArea.classList.add('bg-' + preset.id);
      if (preset.floor) roomArea.classList.add('bg-floor');
      else roomArea.classList.add('no-floor');
    } else if (bg.type === 'color') {
      roomArea.style.backgroundColor = bg.value;
      roomArea.classList.add('no-floor');
    } else if (bg.type === 'image') {
      roomArea.style.backgroundImage = `url(${bg.value})`;
      roomArea.style.backgroundSize = 'cover';
      roomArea.style.backgroundPosition = 'center';
      roomArea.classList.add('no-floor');
    }
  };

  const renderCatTabs = () => {
    catTabsEl.innerHTML = '';
    CATEGORIES.forEach((c) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cat-tab';
      btn.dataset.cat = c.id;
      btn.textContent = c.label;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', 'false');
      btn.addEventListener('click', () => {
        activeCategory = c.id;
        renderCatTabs();
        renderInventory();
        persist();
      });
      if (c.id === activeCategory) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
      }
      catTabsEl.append(btn);
    });
  };

  const renderInventory = () => {
    inventoryRow.innerHTML = '';

    const list = [];
    if (activeCategory === 'all') {
      BUILTIN.forEach((b) => list.push(b));
      state.customItems.forEach((c) => list.push({ ...c, category: 'custom' }));
    } else if (activeCategory === 'custom') {
      state.customItems.forEach((c) => list.push({ ...c, category: 'custom' }));
    } else {
      BUILTIN.filter((b) => b.category === activeCategory).forEach((b) => list.push(b));
    }

    if (activeCategory === 'custom') {
      const uploadSlot = document.createElement('label');
      uploadSlot.className = 'inventory-item inventory-upload';
      uploadSlot.innerHTML = '<span class="upload-plus">＋</span><span class="inventory-label">上傳圖片</span>';
      uploadSlot.querySelector('input[type="file"]')?.remove();
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.hidden = true;
      input.addEventListener('change', (e) => handleCustomUpload(e));
      uploadSlot.append(input);
      inventoryRow.append(uploadSlot);
    }

    if (activeCategory === 'custom' && list.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'inventory-empty';
      empty.textContent = '尚未上傳任何素材，點上方 ＋ 上傳圖片';
      inventoryRow.append(empty);
      return;
    }

    list.forEach((item) => {
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'inventory-item';
      slot.dataset.type = item.type;
      slot.setAttribute('aria-label', `加入${item.label || '素材'}`);
      slot.title = item.label || '';

      if (item.category === 'custom') {
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.label || '';
        img.className = 'item-thumb';
        slot.append(img);
      } else {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'item-icon';
        iconSpan.textContent = item.emoji;
        iconSpan.style.fontSize = item.iconSize;
        slot.append(iconSpan);
      }

      const label = document.createElement('span');
      label.className = 'inventory-label';
      label.textContent = item.label || '素材';
      slot.append(label);

      slot.addEventListener('click', () => spawnAtCenter(item.type));
      inventoryRow.append(slot);
    });
  };

  const buildPlacedItem = (data) => {
    const meta = getMeta(data.type);
    if (!meta) return null;
    const el = document.createElement('div');
    el.className = 'placed-item';
    el.dataset.id = data.id;
    el.dataset.type = data.type;
    el.style.width = meta.width + 'px';
    el.style.height = meta.height + 'px';
    el.style.left = data.x + 'px';
    el.style.top = data.y + 'px';
    el.style.transformOrigin = 'top left';
    el.style.transform = `scale(${data.scale || 1})`;

    const iconWrap = document.createElement('div');
    iconWrap.className = 'placed-icon';
    if (meta.category === 'custom') {
      const img = document.createElement('img');
      img.src = meta.src;
      img.alt = meta.label || '';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      iconWrap.append(img);
    } else {
      const icon = document.createElement('span');
      icon.className = 'item-icon';
      icon.textContent = meta.emoji;
      icon.style.fontSize = meta.iconSize;
      iconWrap.append(icon);
    }
    el.append(iconWrap);

    el.addEventListener('pointerdown', onItemPointerDown);
    return el;
  };

  const spawnAtCenter = (type) => {
    const meta = getMeta(type);
    if (!meta) return;
    const roomRect = roomArea.getBoundingClientRect();
    const cx = Math.max(0, (roomRect.width - meta.width) / 2);
    const cy = Math.max(0, (roomRect.height - meta.height) / 2);
    addItem({ id: uid(), type, x: cx, y: cy, scale: 1 });
  };

  const addItem = (data) => {
    state.items.push(data);
    const el = buildPlacedItem(data);
    if (el) roomArea.append(el);
    persist();
  };

  const removeItem = (id) => {
    state.items = state.items.filter((it) => it.id !== id);
    const el = roomArea.querySelector(`[data-id="${id}"]`);
    if (el) el.remove();
    if (selectedId === id) selectItem(null);
    persist();
  };

  const selectItem = (id) => {
    selectedId = id;
    roomArea.querySelectorAll('.placed-item').forEach((el) => {
      el.classList.toggle('selected', el.dataset.id === id);
    });
    if (id) {
      selectionMenu.hidden = false;
    } else {
      selectionMenu.hidden = true;
    }
  };

  const setItemScale = (id, scale) => {
    const it = state.items.find((i) => i.id === id);
    if (!it) return;
    const newScale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, scale));
    it.scale = newScale;
    const el = roomArea.querySelector(`[data-id="${id}"]`);
    if (el) {
      el.style.transform = `scale(${newScale})`;
      const clamped = clampToRoom(el, it.x, it.y);
      it.x = clamped.x;
      it.y = clamped.y;
      el.style.left = clamped.x + 'px';
      el.style.top = clamped.y + 'px';
    }
    persist();
  };

  const onItemPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const el = e.currentTarget;
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { el.setPointerCapture(e.pointerId); } catch (_) {}
    el.addEventListener('pointermove', onItemPointerMove);
    el.addEventListener('pointerup', onItemPointerEnd);
    el.addEventListener('pointercancel', onItemPointerEnd);

    if (!dragInfo) {
      const rect = el.getBoundingClientRect();
      dragInfo = {
        el,
        pointerId: e.pointerId,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        startX: e.clientX,
        startY: e.clientY,
        isDragging: false
      };
    }

    if (activePointers.size === 2) startPinch();
  };

  const startPinch = () => {
    const id = selectedId;
    if (!id) return;
    const it = state.items.find((i) => i.id === id);
    if (!it) return;
    pinchStartDist = currentPinchDist();
    pinchStartItemScale = it.scale;
  };

  const currentPinchDist = () => {
    const pts = [...activePointers.values()];
    if (pts.length < 2) return 0;
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  };

  const onItemPointerMove = (e) => {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (dragInfo && dragInfo.pointerId === e.pointerId) {
      const dx = e.clientX - dragInfo.startX;
      const dy = e.clientY - dragInfo.startY;

      if (!dragInfo.isDragging) {
        if (Math.hypot(dx, dy) < 5) return;
        dragInfo.isDragging = true;
        dragInfo.el.classList.add('dragging');
        if (selectedId !== dragInfo.el.dataset.id) {
          selectItem(dragInfo.el.dataset.id);
        }
      }

      const roomRect = roomArea.getBoundingClientRect();
      const nx = e.clientX - roomRect.left - dragInfo.offsetX;
      const ny = e.clientY - roomRect.top - dragInfo.offsetY;
      const clamped = clampToRoom(dragInfo.el, nx, ny);
      dragInfo.el.style.left = clamped.x + 'px';
      dragInfo.el.style.top = clamped.y + 'px';
    }

    if (activePointers.size === 2) handlePinch();
  };

  const handlePinch = () => {
    const id = selectedId;
    if (!id || pinchStartDist <= 0) return;
    const dist = currentPinchDist();
    if (dist <= 0) return;
    const ratio = dist / pinchStartDist;
    setItemScale(id, pinchStartItemScale * ratio);
  };

  const onItemPointerEnd = (e) => {
    if (!dragInfo && activePointers.size === 0) return;
    const isPrimary = dragInfo && dragInfo.pointerId === e.pointerId;
    const wasDragging = dragInfo ? dragInfo.isDragging : false;
    const id = dragInfo ? dragInfo.el.dataset.id : null;
    const el = dragInfo ? dragInfo.el : e.currentTarget;

    el.removeEventListener('pointermove', onItemPointerMove);
    el.removeEventListener('pointerup', onItemPointerEnd);
    el.removeEventListener('pointercancel', onItemPointerEnd);
    el.classList.remove('dragging');
    activePointers.delete(e.pointerId);

    if (isPrimary) {
      if (wasDragging) {
        const it = state.items.find((i) => i.id === id);
        if (it) {
          it.x = parseFloat(el.style.left) || 0;
          it.y = parseFloat(el.style.top) || 0;
          persist();
        }
      } else {
        if (selectedId === id) selectItem(null);
        else selectItem(id);
      }
      dragInfo = null;
    }

    if (activePointers.size < 2) {
      pinchStartDist = 0;
    }
  };

  roomArea.addEventListener('pointerdown', (e) => {
    if (e.target === roomArea && selectedId) selectItem(null);
  });

  selectionMenu.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn || !selectedId) return;
    const act = btn.dataset.act;
    const it = state.items.find((i) => i.id === selectedId);
    if (!it) return;
    if (act === 'grow') setItemScale(selectedId, it.scale + SCALE_STEP);
    else if (act === 'shrink') setItemScale(selectedId, it.scale - SCALE_STEP);
    else if (act === 'delete') removeItem(selectedId);
    else if (act === 'close') selectItem(null);
  });

  const handleCustomUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      alert('圖片太大（超過 500 KB），請換小張的');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSide = 200;
        const ratio = img.width > img.height ? maxSide / img.width : maxSide / img.height;
        const w = Math.round(img.width * Math.min(1, ratio));
        const h = Math.round(img.height * Math.min(1, ratio));
        const newCustom = {
          id: 'custom-' + uid(),
          label: file.name.replace(/\.[^.]+$/, '').slice(0, 16) || '素材',
          src: reader.result,
          width: w,
          height: h
        };
        state.customItems.push(newCustom);
        if (activeCategory === 'custom' || activeCategory === 'all') renderInventory();
        else { activeCategory = 'custom'; renderCatTabs(); renderInventory(); }
        updateMetaCache();
        persist();
        if (typeof AppToast !== 'undefined') AppToast.showToast('已新增素材');
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  itemUploadEl.addEventListener('change', handleCustomUpload);

  customClearBtn.addEventListener('click', () => {
    if (state.customItems.length === 0) return;
    if (!confirm('確定要清除所有自訂素材？已佈置的自訂道具也會消失。')) return;
    const customIds = new Set(state.customItems.map((c) => c.id));
    state.customItems = [];
    state.items = state.items.filter((it) => !customIds.has(it.type));
    roomArea.querySelectorAll('.placed-item').forEach((el) => {
      if (customIds.has(el.dataset.type)) el.remove();
    });
    updateMetaCache();
    renderInventory();
    if (selectedId && customIds.has(state.items.find((i) => i.id === selectedId)?.type)) {
      selectItem(null);
    }
    persist();
  });

  resetBtn.addEventListener('click', () => {
    if (state.items.length === 0 && state.customItems.length === 0) return;
    if (!confirm('確定要重置房間？（自訂素材會保留）')) return;
    state.items = [];
    roomArea.querySelectorAll('.placed-item').forEach((el) => el.remove());
    selectItem(null);
    persist();
  });

  const handleResize = () => {
    state.items.forEach((it) => {
      const el = roomArea.querySelector(`[data-id="${it.id}"]`);
      if (!el) return;
      const clamped = clampToRoom(el, it.x, it.y);
      it.x = clamped.x;
      it.y = clamped.y;
      el.style.left = clamped.x + 'px';
      el.style.top = clamped.y + 'px';
    });
    persist();
  };
  window.addEventListener('resize', handleResize);

  const init = () => {
    updateMetaCache();
    state.items.forEach((it) => {
      const el = buildPlacedItem(it);
      if (el) roomArea.append(el);
    });
    renderBgPicker();
    updateBgPickerActive();
    applyBackground();
    renderCatTabs();
    renderInventory();
  };

  init();

  return {
    spawnAtCenter,
    removeItem,
    setBackground,
    items: () => [...state.items]
  };
})();