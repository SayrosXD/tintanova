(() => {
  const process = document.querySelector('#proceso');
  const map = process?.querySelector('.flow-map');
  const controls = process?.querySelector('.flow-controls');
  if (!map || !controls) return;

  const tabs = [...map.querySelectorAll('a[href^="#etapa-"]')];
  const panels = tabs.map(tab => process.querySelector(tab.hash));
  const previous = controls.querySelector('[data-flow-prev]');
  const next = controls.querySelector('[data-flow-next]');
  const status = controls.querySelector('[data-flow-status]');
  if (!tabs.length || panels.some(panel => !panel) || !previous || !next || !status) return;

  let selected = 0;

  function selectStage(index) {
    selected = index;

    tabs.forEach((tab, stage) => {
      const active = stage === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[stage].hidden = !active;
    });

    previous.setAttribute('aria-disabled', String(selected === 0));
    next.setAttribute('aria-disabled', String(selected === tabs.length - 1));
  }

  function revealStage() {
    panels[selected].scrollIntoView({ block: 'nearest' });
  }

  function moveStage(offset) {
    const index = selected + offset;
    if (index < 0 || index >= tabs.length) return;

    selectStage(index);
    status.textContent = `Etapa ${index + 1} de ${tabs.length}. ${panels[index].querySelector('h3').textContent}.`;
    revealStage();
  }

  function alternateClick(event) {
    return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  }

  map.setAttribute('role', 'tablist');
  tabs.forEach((tab, index) => {
    const panel = panels[index];
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;

    tab.addEventListener('click', event => {
      if (alternateClick(event)) return;

      event.preventDefault();
      selectStage(index);
      if (event.detail > 0) revealStage();
    });
  });

  map.addEventListener('keydown', event => {
    const index = tabs.indexOf(event.target);
    if (index < 0 || event.metaKey || event.ctrlKey || event.altKey) return;

    const keyboardTargets = {
      ArrowLeft: (index + tabs.length - 1) % tabs.length,
      ArrowRight: (index + 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
      ' ': index,
    };
    if (!Object.hasOwn(keyboardTargets, event.key)) return;

    event.preventDefault();
    const target = keyboardTargets[event.key];
    selectStage(target);
    tabs[target].focus();
  });

  function selectHashStage() {
    const index = tabs.findIndex(tab => tab.hash === location.hash);
    if (index < 0) return false;

    selectStage(index);
    return true;
  }

  if (!selectHashStage()) selectStage(0);
  process.setAttribute('data-flow-ready', '');
  controls.hidden = false;
  window.addEventListener('hashchange', () => {
    if (selectHashStage()) revealStage();
  });
  previous.addEventListener('click', () => moveStage(-1));
  next.addEventListener('click', () => moveStage(1));

  for (const link of process.querySelectorAll('[data-flow-jump]')) {
    const index = tabs.findIndex(tab => tab.hash === link.hash);
    if (index < 0) continue;
    link.addEventListener('click', event => {
      if (alternateClick(event)) return;
      event.preventDefault();
      selectStage(index);
      panels[index].focus({ preventScroll: true });
      panels[index].scrollIntoView({ block: 'start' });
    });
  }

  const dialog = process.querySelector('.flow-photo-dialog');
  if (typeof dialog?.showModal !== 'function') return;

  const enlargedPhoto = dialog.querySelector('img');
  const caption = dialog.querySelector('figcaption');
  for (const link of process.querySelectorAll('.flow-photo')) {
    link.addEventListener('click', event => {
      if (alternateClick(event)) return;
      event.preventDefault();
      enlargedPhoto.src = link.href;
      enlargedPhoto.alt = link.querySelector('img').alt;
      caption.textContent = link.querySelector('span').textContent;
      dialog.showModal();
    });
  }
})();
