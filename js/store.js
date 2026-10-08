const Store = (() => {
  const KEY_NOTES      = 'helper.notes.v1';
  const KEY_PREFS      = 'helper.prefs.v1';
  const KEY_ROOM_OLD   = 'helper.room.v1';
  const KEY_ROOM       = 'helper.room.v2';

  const safeParse = (raw, fallback) => {
    try { return raw == null ? fallback : JSON.parse(raw); }
    catch { return fallback; }
  };

  const loadNotes = () => safeParse(localStorage.getItem(KEY_NOTES), []);
  const saveNotes = (notes) => localStorage.setItem(KEY_NOTES, JSON.stringify(notes));

  const loadPrefs = () => safeParse(localStorage.getItem(KEY_PREFS), { lastTab: 'board' });
  const savePrefs = (prefs) => localStorage.setItem(KEY_PREFS, JSON.stringify(prefs));

  const defaultRoomState = () => ({
    items: [],
    customItems: [],
    background: { type: 'preset', value: 'default' },
    activeCategory: 'all'
  });

  const migrateRoom = (data) => {
    if (!data || typeof data !== 'object') return defaultRoomState();
    const items = Array.isArray(data.items) ? data.items.map((it) => ({
      id: String(it.id),
      type: String(it.type),
      x: Number(it.x) || 0,
      y: Number(it.y) || 0,
      scale: Number(it.scale) || 1
    })) : [];
    const customItems = Array.isArray(data.customItems) ? data.customItems.map((c) => ({
      id: String(c.id),
      label: String(c.label || '素材'),
      src: String(c.src || ''),
      width: Number(c.width) || 100,
      height: Number(c.height) || 100
    })) : [];
    const bg = data.background;
    const background = (bg && (bg.type === 'color' || bg.type === 'image' || bg.type === 'preset'))
      ? bg
      : { type: 'preset', value: 'default' };
    return {
      items,
      customItems,
      background,
      activeCategory: data.activeCategory || 'all'
    };
  };

  const loadRoom = () => {
    const raw = localStorage.getItem(KEY_ROOM);
    if (raw != null) return migrateRoom(safeParse(raw, null));

    const old = safeParse(localStorage.getItem(KEY_ROOM_OLD), null);
    if (Array.isArray(old)) {
      const migrated = {
        items: old.map((it) => ({ id: String(it.id), type: String(it.type), x: Number(it.x) || 0, y: Number(it.y) || 0, scale: 1 })),
        customItems: [],
        background: { type: 'preset', value: 'default' },
        activeCategory: 'all'
      };
      localStorage.setItem(KEY_ROOM, JSON.stringify(migrated));
      return migrated;
    }
    return defaultRoomState();
  };

  const saveRoom = (state) => localStorage.setItem(KEY_ROOM, JSON.stringify(state));

  return { loadNotes, saveNotes, loadPrefs, savePrefs, loadRoom, saveRoom };
})();