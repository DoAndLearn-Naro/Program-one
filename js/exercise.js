const Exercise = (() => {
  const RECIPES = [
    // 待整合：等使用者提供內容後替換此處
  ];

  const partEl = document.getElementById('exercise-part');
  const pickBtn = document.getElementById('exercise-pick');
  const titleEl = document.getElementById('exercise-title');
  const descEl = document.getElementById('exercise-desc');
  const metaEl = document.getElementById('exercise-meta');
  const allEl = document.getElementById('exercise-all');

  const renderList = () => {
    allEl.innerHTML = '';
    if (RECIPES.length === 0) {
      allEl.innerHTML = '<li>尚未加入運動建議，請提供內容後整理進來。</li>';
      return;
    }
    RECIPES.forEach((r) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${r.title}</strong> — ${r.desc}`;
      allEl.append(li);
    });
  };

  const filterByPart = (part) =>
    part === 'any' ? RECIPES.slice() : RECIPES.filter((r) => r.part === part);

  const pickRandom = (part) => {
    const pool = filterByPart(part);
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const show = (item) => {
    if (!item) {
      titleEl.textContent = '目前沒有符合的建議';
      descEl.textContent = '請換一個部位試試，或等內容整合完畢。';
      metaEl.textContent = '';
      return;
    }
    titleEl.textContent = item.title;
    descEl.textContent = item.desc;
    metaEl.textContent = [item.part, item.duration].filter(Boolean).join(' · ');
  };

  pickBtn.addEventListener('click', () => show(pickRandom(partEl.value)));

  renderList();

  return { pickRandom, show };
})();