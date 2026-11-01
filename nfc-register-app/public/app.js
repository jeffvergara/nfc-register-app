const $ = id => document.getElementById(id);
let stream = null;
let photoData = null;
let nfcUid = '';

// ---- messages / reader status are stored as keys so they re-translate when the language changes ----
let msgState = null;
let readerSt = { key: 'rdNone', on: false, args: [] };

function showMsg(key, ok, ...args) { msgState = key ? { key, ok: !!ok, args } : null; renderMsg(); }
function showRaw(text, ok) { msgState = text ? { raw: text, ok: !!ok } : null; renderMsg(); }
function renderMsg() {
  const box = $('msg');
  box.replaceChildren();
  if (!msgState) return;
  const d = document.createElement('div');
  d.className = 'msg ' + (msgState.ok ? 'ok' : 'err');
  d.textContent = msgState.raw ?? t(msgState.key, ...(msgState.args || []));
  box.append(d);
}
function setReader(key, on, ...args) { readerSt = { key, on: !!on, args }; renderReader(); }
function renderReader() {
  $('nfcState').textContent = t(readerSt.key, ...readerSt.args);
  $('nfcState').classList.toggle('on', readerSt.on);
}
function renderUid() { $('uidShow').textContent = nfcUid || t('uidNone'); }
function renderPhotoAlt() { $('preview').alt = t('snap'); }
onLang(() => { renderMsg(); renderReader(); renderUid(); renderPhotoAlt(); });

// ---------------- Camera ----------------
$('startCam').onclick = async () => {
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('camNotAvail');
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
    $('video').srcObject = stream;
    $('video').hidden = false; $('preview').hidden = true; $('camPh').hidden = true;
    $('snap').disabled = false; $('retake').hidden = true;
    showMsg('');
  } catch (e) {
    if (e.message === 'camNotAvail') showMsg('camNotAvail');
    else if (e.name === 'NotAllowedError') showMsg('camDenied');
    else showRaw(e.message);
  }
};

function stopCam() { stream?.getTracks().forEach(t => t.stop()); stream = null; }

$('snap').onclick = () => {
  const v = $('video'), c = $('canvas');
  const w = v.videoWidth, h = v.videoHeight;
  if (!w) return;
  const scale = Math.min(1, 800 / w);
  c.width = Math.round(w * scale); c.height = Math.round(h * scale);
  c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
  photoData = c.toDataURL('image/jpeg', 0.85);
  $('preview').src = photoData;
  $('preview').hidden = false; v.hidden = true;
  stopCam();
  $('snap').disabled = true; $('retake').hidden = false;
};

$('retake').onclick = () => { photoData = null; $('startCam').click(); };

// ---------------- NFC ----------------
function setUid(raw, source) {
  const uid = String(raw).replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
  if (uid.length < 4) return;
  nfcUid = uid;
  renderUid();
  $('uidManual').value = uid;
  if (source) setReader('rdRead', true, source); else setReader('rdUidSet', true);
}
$('uidManual').addEventListener('input', e => {
  const v = e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
  nfcUid = v.length >= 4 ? v : '';
  renderUid();
});
// Keyboard-wedge readers type the UID and press Enter: don't submit the form
$('uidManual').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); setUid(e.target.value, 'keyboard'); } });

// Arduino + PN532 (or similar) over USB serial. Sketch prints lines like:  UID:04A1B2C3
$('btnArduino').onclick = async () => {
  if (!('serial' in navigator)) return showMsg('serialUnsupported');
  try {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });
    setReader('rdArduinoOn', true);
    const dec = new TextDecoderStream();
    port.readable.pipeTo(dec.writable).catch(() => {});
    const reader = dec.readable.getReader();
    let buf = '';
    (async () => {
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += value;
          let i;
          while ((i = buf.indexOf('\n')) >= 0) {
            const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
            const m = /^UID:\s*([0-9A-Fa-f ]+)$/.exec(line);
            if (m) setUid(m[1], 'Arduino');
          }
        }
      } catch { /* unplugged */ }
      setReader('rdArduinoOff', false);
    })();
  } catch (e) { if (e.name !== 'NotFoundError') showRaw(t('serialFail') + e.message); }
};

// SpringCard (PC/SC) via local bridge: run `npm run bridge` on the PC with the reader
$('btnSpring').onclick = () => {
  setReader('rdBridgeConn', false);
  let ws;
  try { ws = new WebSocket('ws://localhost:8765'); } catch (e) { return showRaw(e.message); }
  ws.onopen = () => setReader('rdBridgeOn', true);
  ws.onmessage = ev => {
    try {
      const m = JSON.parse(ev.data);
      if (m.type === 'uid') setUid(m.uid, 'SpringCard');
      else if (m.type === 'reader') setReader('rdReader', true, m.name);
      else if (m.type === 'error') showRaw(m.message);
    } catch { /* ignore */ }
  };
  ws.onerror = () => { setReader('rdBridgeDown', false); showMsg('bridgeFail'); };
  ws.onclose = () => setReader('rdBridgeOff', false);
};

// Phone NFC (Android Chrome)
$('btnWebNfc').onclick = async () => {
  if (!('NDEFReader' in window)) return showMsg('webNfcUnsupported');
  try {
    const r = new NDEFReader();
    await r.scan();
    setReader('rdPhoneOn', true);
    r.onreading = ev => setUid(ev.serialNumber, 'phone NFC');
  } catch (e) { showRaw(t('nfcErr') + e.message); }
};

// ---------------- Submit ----------------
$('form').addEventListener('submit', async e => {
  e.preventDefault();
  showMsg('');
  const body = {
    fullName: $('fullName').value, email: $('email').value, phone: $('phone').value,
    password: $('password').value, photo: photoData, nfcUid
  };
  if (!body.fullName.trim() || !body.email.trim() || body.password.length < 8) return showMsg('fillRequired');
  $('submit').disabled = true;
  try {
    const r = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Registration failed');
    showMsg('regDone', true);
    $('form').reset(); photoData = null; nfcUid = '';
    $('preview').hidden = true; $('camPh').hidden = false; renderUid();
    setReader('rdNone', false);
  } catch (err) { showRaw(err.message); }
  $('submit').disabled = false;
});
window.addEventListener('beforeunload', stopCam);
