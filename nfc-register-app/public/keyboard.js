/*
  Compact on-screen keyboard for touch screens / kiosks.
  Inputs opt in with  data-kb="name | email | phone | password".
  Add  ?kb=off  to the page address to turn it off (e.g. when a physical keyboard is used).
*/
(() => {
  if (/[?&]kb=off/.test(location.search)) return;

  const SPECIAL = new Set(['SHIFT', 'BACK', 'SPACE', 'NEXT', 'LANG']);
  const split = s => s.split('');
  const DIGITS = split('1234567890');
  const EN = [split('qwertyuiop'), split('asdfghjkl')];
  const AR = [split('ضصثقفغعهخحجد'), split('شسيبلاتنمكط'), ['ئ', 'ء', 'ؤ', 'ر', 'ى', 'ة', 'و', 'ز', 'ظ', 'BACK']];

  let cur = null;          // input being edited
  let nameLang = 'en';     // layout language for the name field
  let shiftOn = false;
  let lay = null;
  let repeatTimer = null;
  const keys = [];         // rendered keys: { el, tok }

  // ---------- layouts ----------
  function layoutFor(el) {
    switch (el.dataset.kb) {
      case 'phone':
        return { cls: 'num', rows: [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['+', '0', 'BACK']], bottom: ['+971', 'NEXT'] };
      case 'email':
        return { rows: [DIGITS, ...EN, [...split('zxcvbnm'), 'BACK']], bottom: ['@', '.', '_', '-', '.com', '@gmail.com', 'NEXT'] };
      case 'password':
        return { shiftKey: true, rows: [DIGITS, ...EN, ['SHIFT', ...split('zxcvbnm'), 'BACK']], bottom: ['!', '@', '#', '$', '.', '_', '-', 'NEXT'] };
      default: // name
        return nameLang === 'ar'
          ? { rows: AR, bottom: ['LANG', 'SPACE', 'NEXT'] }
          : { autocap: true, rows: [...EN, ['SHIFT', ...split('zxcvbnm'), 'BACK']], bottom: ['LANG', 'SPACE', 'NEXT'] };
    }
  }

  // ---------- DOM ----------
  const kb = document.createElement('div');
  kb.className = 'kb';
  kb.dir = 'ltr';
  kb.setAttribute('role', 'group');
  kb.innerHTML = '<div class="kb-inner"><div class="kb-bar"><span class="kb-title"></span><button type="button" class="kb-min">⌄</button></div><div class="kb-rows"></div></div>';
  document.body.append(kb);
  const inner = kb.querySelector('.kb-inner');
  const rowsBox = kb.querySelector('.kb-rows');
  const title = kb.querySelector('.kb-title');
  const minBtn = kb.querySelector('.kb-min');

  const fab = document.createElement('button');
  fab.type = 'button'; fab.className = 'kb-fab'; fab.textContent = '⌨'; fab.hidden = true;
  document.body.append(fab);

  const fields = () => [...document.querySelectorAll('[data-kb]')].filter(e => e.offsetParent !== null);
  const isLast = () => { const f = fields(); return f[f.length - 1] === cur; };

  // ---------- text editing ----------
  function insert(text) {
    const s = cur.selectionStart ?? cur.value.length, e = cur.selectionEnd ?? s;
    cur.setRangeText(text, s, e, 'end');
    cur.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function backspace() {
    const s = cur.selectionStart ?? cur.value.length, e = cur.selectionEnd ?? s;
    if (s !== e) cur.setRangeText('', s, e, 'end');
    else if (s > 0) cur.setRangeText('', s - 1, s, 'end');
    cur.dispatchEvent(new Event('input', { bubbles: true }));
  }
  const atWordStart = () => { const b = cur.value.slice(0, cur.selectionStart ?? cur.value.length); return b === '' || /\s$/.test(b); };

  function autoShift() {
    if (lay.autocap) shiftOn = atWordStart();
    else if (lay.shiftKey) shiftOn = false;
    refresh();
  }

  // ---------- rendering ----------
  function label(tok) {
    switch (tok) {
      case 'SHIFT': return '⇧';
      case 'BACK': return '⌫';
      case 'SPACE': return t('kbSpace');
      case 'NEXT': return isLast() ? '✓' : '➜';
      case 'LANG': return nameLang === 'ar' ? 'EN' : 'ع';
      default: return (shiftOn && /^[a-z]$/.test(tok)) ? tok.toUpperCase() : tok;
    }
  }
  function refresh() {
    keys.forEach(({ el, tok }) => {
      el.textContent = label(tok);
      if (tok === 'SHIFT') el.classList.toggle('on', shiftOn);
    });
  }
  function build() {
    lay = layoutFor(cur);
    inner.className = 'kb-inner ' + (lay.cls || '');
    keys.length = 0;
    rowsBox.replaceChildren();
    const addRow = toks => {
      const row = document.createElement('div');
      row.className = 'kb-row';
      toks.forEach(tok => row.append(makeKey(tok)));
      rowsBox.append(row);
    };
    lay.rows.forEach(addRow);
    addRow(lay.bottom);
    const lab = document.querySelector(`label[for="${cur.id}"]`);
    title.textContent = lab ? lab.textContent : '';
    minBtn.setAttribute('aria-label', t('kbHide'));
    fab.setAttribute('aria-label', t('kbShow'));
    shiftOn = !!lay.autocap && atWordStart();
    refresh();
  }
  function makeKey(tok) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'k';
    if (SPECIAL.has(tok)) el.classList.add(tok === 'SPACE' ? 'space' : tok === 'NEXT' ? 'act' : 'sp');
    else if (tok.length > 1 && !/^[لا]+$/.test(tok) && tok !== 'لا') el.classList.add('quick');
    if (tok === 'BACK') el.classList.add('back');
    keys.push({ el, tok });
    el.addEventListener('pointerdown', e => { e.preventDefault(); press(tok); if (tok === 'BACK') startRepeat(); });
    return el;
  }

  // ---------- key presses ----------
  function press(tok) {
    if (!cur) return;
    switch (tok) {
      case 'SHIFT': shiftOn = !shiftOn; refresh(); break;
      case 'BACK': backspace(); autoShift(); break;
      case 'SPACE': insert(' '); autoShift(); break;
      case 'NEXT': goNext(); break;
      case 'LANG': nameLang = nameLang === 'ar' ? 'en' : 'ar'; build(); break;
      default: insert(shiftOn && /^[a-z]$/.test(tok) ? tok.toUpperCase() : tok); autoShift();
    }
  }
  function startRepeat() {
    stopRepeat();
    repeatTimer = setTimeout(() => { repeatTimer = setInterval(() => { backspace(); autoShift(); }, 70); }, 420);
  }
  function stopRepeat() { clearTimeout(repeatTimer); clearInterval(repeatTimer); repeatTimer = null; }
  ['pointerup', 'pointercancel'].forEach(ev => document.addEventListener(ev, stopRepeat));

  function goNext() {
    const f = fields();
    const next = f[f.indexOf(cur) + 1];
    if (next) next.focus(); else { hide(); cur.blur(); }
  }

  // ---------- show / hide ----------
  function show(el) {
    cur = el;
    build();
    kb.classList.add('open');
    fab.hidden = true;
    document.body.classList.add('kb-open');
    requestAnimationFrame(ensureVisible);
  }
  // Scroll so the field sits in the middle of the space ABOVE the keyboard
  function ensureVisible() {
    if (!cur) return;
    const kbH = kb.offsetHeight;
    document.body.style.setProperty('--kb-h', kbH + 'px');
    const r = cur.getBoundingClientRect();
    const free = window.innerHeight - kbH;
    const delta = r.top + r.height / 2 - free / 2;
    if (Math.abs(delta) > 2) window.scrollBy({ top: delta, behavior: 'smooth' });
  }
  function hide() {
    kb.classList.remove('open');
    document.body.classList.remove('kb-open');
    fab.hidden = true;
  }
  function minimize() { hide(); if (cur) fab.hidden = false; }

  kb.addEventListener('mousedown', e => e.preventDefault()); // keep focus in the input
  minBtn.addEventListener('pointerdown', e => { e.preventDefault(); minimize(); });
  fab.addEventListener('pointerdown', e => { e.preventDefault(); if (cur) { cur.focus(); show(cur); } });

  document.addEventListener('focusin', e => { const el = e.target.closest && e.target.closest('[data-kb]'); if (el) show(el); });
  document.addEventListener('click', e => {
    const el = e.target.closest && e.target.closest('[data-kb]');
    if (el && !kb.classList.contains('open')) show(el);
  });
  document.addEventListener('pointerdown', e => {
    // composedPath is fixed at dispatch time, so keys that re-render the keyboard still count as "inside"
    const path = e.composedPath();
    if (path.includes(kb) || path.includes(fab) || path.some(n => n.dataset && n.dataset.kb)) return;
    hide();
  });

  // language switch: reset the name keyboard to the page language and re-label keys
  nameLang = LANG === 'ar' ? 'ar' : 'en';
  onLang(() => {
    nameLang = LANG === 'ar' ? 'ar' : 'en';
    if (cur && kb.classList.contains('open')) build();
  });
})();
