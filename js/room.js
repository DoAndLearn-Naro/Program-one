const Room = (() => {
  const roomArea = document.getElementById('room-area');
  const inventoryPanel = document.getElementById('inventory-panel');
  const trashArea = document.getElementById('trash-area');
  const emptyHint = document.getElementById('room-empty');
  const resetBtn = document.getElementById('room-reset');

  const CATALOG = [
    { type: 'sofa',     label: '沙發',  emoji: '🛋️', width: 150, height: 100, iconSize: '5rem' },
    { type: 'plant',    label: '盆栽',  emoji: '🪴', width: 90,  height: 110, iconSize: '4.5rem' },
    { type: 'cat',      label: '貓咪',  emoji: '🐈', width: 80,  height: 80,  iconSize: '3.5rem' },
    { type: 'painting', label: '畫作',  emoji: '🖼️', width: 110, height: 130, iconSize: '4.5rem' },
    { type: 'lamp',     label: '立燈',  emoji: '💡', width: 60,  height: 140, iconSize: '4rem' },
    { type: 'gift',     label: '禮物',  emoji: '🎁', width: 80,  height: 80,  iconSize: '3.5rem' },
    { type: 'bed',      label: '床',    emoji: '🛏️', width: 170, height: 110, iconSize: '5rem' },
    { type: 'book',     label: '書本',  emoji: '📚', width: 80,  height: 70,  iconSize: '3rem' },
    { type: 'photo',    label: '相框',  emoji: '🖼️', width: 80,  height: 100, iconSize: '3.5rem' },
    { type: 'flower',   label: '花瓶',  emoji: '🌷', width: 60,  height: 100, iconSize: '3.5rem' },
    { type: 'clock',    label: '時鐘',  emoji: '🕰️', width: 70,  height: 90,  iconSize: '3.5rem' },
    { type: 'tea',      label: '茶壺',  emoji: '🫖', width: 70,  height: 80,  iconSize: '3.5rem' }
  ];

  const META = Object.fromEntries(CATALOG.map((c) => [c.type, c]));

  let dragged = null;
  let offsetX = 0;
  let offsetY = 0;
  let activePointerId = null;
  let items = [];

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const clampToRoom = (el, nx, ny) => {
    const roomRect = roomArea.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const w = elRect.width || 60;
    const h = elRect.height || 60;
    const minX = 0;
    const minY = 0;
    const maxX = roomRect.width - w;
    const maxY = roomRect.height - h;
    return {
      x: Math.min(Math.max(nx, minX), Math.max(maxX, minX)),
      y: Math.min(Math.max(ny, minY), Math.max(maxY, minY))
    };
  };

  const persist = () => {
    const data = items.map((it) => ({ id: it.id, type: it.type, x: it.x, y: it.y }));
    Store.saveRoom(data);
    updateEmptyHint();
  };

  const updateEmptyHint = () => {
    if (!emptyHint) return;
    emptyHint.hidden = items.length > 0;
  };

  const renderInventory = () => {
    inventoryPanel.innerHTML = '';
    CATALOG.forEach((c) => {
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'inventory-item';
      slot.dataset.type = c.type;
      slot.setAttribute('aria-label', `加入${c.label}`);
      const iconSpan = document.createElement('span');
      iconSpan.className = 'item-icon';
      iconSpan.textContent = c.emoji;
      iconSpan.style.fontSize = c.iconSize;
      const label = document.createElement('span');
      label.className = 'inventory-label';
      label.textContent = c.label;
      slot.append(iconSpan, label);
      slot.addEventListener('click', () => spawnAtCenter(c.type));
      inventoryPanel.append(slot);
    });
  };

  const buildPlacedItem = (data) => {
    const meta = META[data.type];
    if (!meta) return null;
    const el = document.createElement('div');
    el.className = 'placed-item';
    el.dataset.id = data.id;
    el.dataset.type = data.type;
    el.style.width = meta.width + 'px';
    el.style.height = meta.height + 'px';
    el.style.left = data.x + 'px';
    el.style.top = data.y + 'px';

    const icon = document.createElement('span');
    icon.className = 'item-icon';
    icon.textContent = meta.emoji;
    icon.style.fontSize = meta.iconSize;
    el.append(icon);

    el.addEventListener('pointerdown', (e) => beginDrag(el, e));
    return el;
  };

  const spawnAtCenter = (type) => {
    const meta = META[type];
    if (!meta) return;
    const roomRect = roomArea.getBoundingClientRect();
    const cx = Math.max(0, (roomRect.width - meta.width) / 2);
    const cy = Math.max(0, (roomRect.height - meta.height) / 2);
    addItem({ id: uid(), type, x: cx, y: cy });
  };

  const addItem = (data) => {
    items.push(data);
    const el = buildPlacedItem(data);
    if (el) roomArea.append(el);
    persist();
  };

  const removeItem = (id) => {
    items = items.filter((it) => it.id !== id);
    const el = roomArea.querySelector(`[data-id="${id}"]`);
    if (el) el.remove();
    persist();
  };

  const beginDrag = (el, e) => {
    e.preventDefault();
    dragged = el;
    activePointerId = e.pointerId;
    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    el.setPointerCapture(e.pointerId);
    el.classList.add('dragging');
    trashArea.classList.add('active');
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerEnd);
    el.addEventListener('pointercancel', onPointerEnd);
  };

  const onPointerMove = (e) => {
    if (!dragged) return;
    const roomRect = roomArea.getBoundingClientRect();
    const nx = e.clientX - roomRect.left - offsetX;
    const ny = e.clientY - roomRect.top - offsetY;
    const clamped = clampToRoom(dragged, nx, ny);
    dragged.style.left = clamped.x + 'px';
    dragged.style.top = clamped.y + 'px';

    const trashRect = trashArea.getBoundingClientRect();
    const isOverTrash =
      e.clientX > trashRect.left && e.clientX < trashRect.right &&
      e.clientY > trashRect.top && e.clientY < trashRect.bottom;
    trashArea.classList.toggle('hover', isOverTrash);
  };

  const onPointerEnd = (e) => {
    if (!dragged) return;
    const trashRect = trashArea.getBoundingClientRect();
    const isOverTrash =
      e.clientX > trashRect.left && e.clientX < trashRect.right &&
      e.clientY > trashRect.top && e.clientY < trashRect.bottom;

    const id = dragged.dataset.id;
    dragged.classList.remove('dragging');
    dragged.removeEventListener('pointermove', onPointerMove);
    dragged.removeEventListener('pointerup', onPointerEnd);
    dragged.removeEventListener('pointercancel', onPointerEnd);
    trashArea.classList.remove('active', 'hover');

    if (isOverTrash) {
      removeItem(id);
    } else {
      const roomRect = roomArea.getBoundingClientRect();
      const left = parseFloat(dragged.style.left) || 0;
      const top = parseFloat(dragged.style.top) || 0;
      const clamped = clampToRoom(dragged, left, top);
      dragged.style.left = clamped.x + 'px';
      dragged.style.top = clamped.y + 'px';
      const it = items.find((i) => i.id === id);
      if (it) { it.x = clamped.x; it.y = clamped.y; persist(); }
    }

    dragged = null;
    activePointerId = null;
  };

  const handleResize = () => {
    items.forEach((it) => {
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

  const reset = () => {
    items = [];
    roomArea.querySelectorAll('.placed-item').forEach((el) => el.remove());
    persist();
  };

  resetBtn.addEventListener('click', () => {
    if (items.length === 0) return;
    if (confirm('確定要清空房間嗎？')) reset();
  });

  window.addEventListener('resize', handleResize);

  const init = () => {
    const saved = Store.loadRoom();
    renderInventory();
    if (Array.isArray(saved)) {
      saved.forEach((it) => {
        items.push(it);
        const el = buildPlacedItem(it);
        if (el) roomArea.append(el);
      });
    }
    updateEmptyHint();
  };

  init();

  return { reset, addItem, removeItem, items: () => items };
})();