const Store = (() => {
  const KEY_NOTES = 'helper.notes.v1';
  const KEY_PREFS = 'helper.prefs.v1';
  const KEY_ROOM  = 'helper.room.v1';

  const safeParse = (raw, fallback) => {
    try { return raw == null ? fallback : JSON.parse(raw); }
    catch { return fallback; }
  };

  const loadNotes = () => safeParse(localStorage.getItem(KEY_NOTES), []);
  const saveNotes = (notes) => localStorage.setItem(KEY_NOTES, JSON.stringify(notes));

  const loadPrefs = () => safeParse(localStorage.getItem(KEY_PREFS), { lastTab: 'board' });
  const savePrefs = (prefs) => localStorage.setItem(KEY_PREFS, JSON.stringify(prefs));

  const loadRoom = () => safeParse(localStorage.getItem(KEY_ROOM), []);
  const saveRoom = (data) => localStorage.setItem(KEY_ROOM, JSON.stringify(data));

  return { loadNotes, saveNotes, loadPrefs, savePrefs, loadRoom, saveRoom };
})();