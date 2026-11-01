/*
  SpringCard (any PC/SC reader) -> browser bridge.
  Run on the computer where the reader is plugged in:   npm run bridge
  The web page connects to ws://localhost:8765 and receives {"type":"uid","uid":"04A1B2C3"}.

  Requirements:
    - SpringCard PC/SC driver installed (Windows: built-in CCID driver or SpringCard driver;
      Linux: pcscd + libpcsclite-dev;  macOS: built-in)
    - npm install   (installs nfc-pcsc and ws)
*/
let NFC, WebSocketServer;
try {
  ({ NFC } = require('nfc-pcsc'));
  ({ WebSocketServer } = require('ws'));
} catch (e) {
  console.error('Missing packages. Run "npm install" in the project folder.\n' + e.message);
  process.exit(1);
}

const PORT = 8765;
// Only pages opened on this machine may talk to the bridge
const ALLOWED = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const wss = new WebSocketServer({
  port: PORT,
  host: '127.0.0.1',
  verifyClient: ({ origin }) => !origin || ALLOWED.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
});
const broadcast = obj => wss.clients.forEach(c => c.readyState === 1 && c.send(JSON.stringify(obj)));
let readerName = null;
wss.on('connection', ws => { if (readerName) ws.send(JSON.stringify({ type: 'reader', name: readerName })); });

const nfc = new NFC();
nfc.on('reader', reader => {
  readerName = reader.reader.name;
  console.log('Reader connected:', readerName);
  broadcast({ type: 'reader', name: readerName });
  reader.autoProcessing = false; // we only need the UID, not NDEF/auth

  reader.on('card', async () => {
    try {
      // Standard PC/SC "Get UID" APDU: FF CA 00 00 00
      const res = await reader.transmit(Buffer.from([0xff, 0xca, 0x00, 0x00, 0x00]), 12);
      const sw = res.slice(-2);
      if (sw[0] === 0x90 && sw[1] === 0x00) {
        const uid = res.slice(0, -2).toString('hex').toUpperCase();
        console.log('Card UID:', uid);
        broadcast({ type: 'uid', uid });
      } else {
        broadcast({ type: 'error', message: 'Reader could not return the card UID.' });
      }
    } catch (err) {
      console.error(err.message);
      broadcast({ type: 'error', message: 'Card read error: ' + err.message });
    }
  });
  reader.on('error', err => console.error('Reader error:', err.message));
  reader.on('end', () => { console.log('Reader removed'); readerName = null; });
});
nfc.on('error', err => console.error('PC/SC error:', err.message));
console.log(`SpringCard bridge listening on ws://127.0.0.1:${PORT}`);
