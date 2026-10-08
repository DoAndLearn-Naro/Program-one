const Board = (() => {
  const listEl = document.getElementById('note-list');
  const emptyEl = document.getElementById('note-empty');
  const formEl = document.getElementById('note-form');
  const inputEl = document.getElementById('note-input');

  const render = () => {
    const notes = Store.loadNotes();
    listEl.innerHTML = '';
    notes.forEach((note) => {
      const li = document.createElement('li');
      li.className = 'note-item' + (note.done ? ' done' : '');
      li.dataset.id = note.id;

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!note.done;
      cb.setAttribute('aria-label', '標記事已完成');
      cb.addEventListener('change', () => toggle(note.id));

      const span = document.createElement('span');
      span.className = 'text';
      span.textContent = note.text;

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn btn-danger';
      del.textContent = '刪除';
      del.setAttribute('aria-label', `刪除記事：${note.text}`);
      del.addEventListener('click', () => remove(note.id));

      li.append(cb, span, del);
      listEl.append(li);
    });
    emptyEl.hidden = notes.length > 0;
  };

  const add = (text) => {
    const t = (text || '').trim();
    if (!t) return false;
    const notes = Store.loadNotes();
    notes.unshift({ id: Date.now() + Math.random().toString(36).slice(2, 7), text: t, done: false, createdAt: Date.now() });
    Store.saveNotes(notes);
    render();
    return true;
  };

  const toggle = (id) => {
    const notes = Store.loadNotes().map((n) => n.id === id ? { ...n, done: !n.done } : n);
    Store.saveNotes(notes);
    render();
  };

  const remove = (id) => {
    const notes = Store.loadNotes().filter((n) => n.id !== id);
    Store.saveNotes(notes);
    render();
  };

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    if (add(inputEl.value)) {
      inputEl.value = '';
      inputEl.focus();
    }
  });

  render();

  return { render, add, toggle, remove };
})();