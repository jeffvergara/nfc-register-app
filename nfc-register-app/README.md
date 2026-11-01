# NFC Registration Web App

Registration form with camera photo capture, NFC card reading (Arduino or SpringCard) and an admin dashboard.
Data is stored in SQLite (`data/app.db`); photos are stored in `data/photos/` and are only visible to the admin.

## Run

```bash
npm install
npm start
```

Open http://localhost:3000. The admin panel is at http://localhost:3000/admin.html.

On first start an admin account is created and its password is printed in the terminal and saved in
`data/admin-credentials.txt` (username `admin`). To choose your own:

```bash
ADMIN_USER=admin ADMIN_PASSWORD='YourStrongPassword' npm start
```
(set it before the first start; delete `data/app.db` to recreate the admin).

The admin dashboard shows total users, users today, last 7 days, users with a photo, users with an NFC card,
the full user list with photos, delete, and CSV export.

## Camera
The browser only allows camera access on `http://localhost` or `https://`. If you deploy it on a server,
put it behind HTTPS (Nginx/Caddy/Cloudflare) and set `SESSION_SECRET`.

## NFC readers

### Arduino (PN532 module)
1. Install libraries "Adafruit PN532" and "Adafruit BusIO" in the Arduino IDE.
2. Wire the PN532 in I2C mode (see comments in `arduino/nfc_reader/nfc_reader.ino`), upload the sketch.
3. Close the Arduino Serial Monitor, open the registration page in Chrome/Edge, click
   **Connect Arduino reader (USB)**, pick the port, then tap a card. The UID fills in automatically.

### SpringCard (or any PC/SC reader)
Browsers cannot talk to PC/SC readers directly, so a tiny local bridge is included:
1. Plug in the reader (install the SpringCard/CCID driver; on Linux install `pcscd`, `libpcsclite-dev`).
2. `npm install` then `npm run bridge` on the computer with the reader.
3. On the page click **Connect SpringCard reader (bridge)** and tap a card.

If your SpringCard reader is set to keyboard-emulation mode, just click the UID field and tap the card.

### Android phone
Chrome on Android supports Web NFC over https: click **Use this phone's NFC**.

## Touch-screen keyboard
The form has a built-in on-screen keyboard (`public/keyboard.js`) so it works on a touch kiosk with no Windows keyboard:
- **Name:** letters only, first letter of each word capitalised automatically. The `ع` key switches to an Arabic layout.
- **Email:** letters, numbers, and shortcut keys `@`, `.com`, `@gmail.com`.
- **Phone:** big number pad with a `+971` shortcut.
- **➜** moves to the next field, **✓** on the last field closes the keyboard, **⌄** minimizes it (tap the round ⌨ button to bring it back).
- To turn it off (for example when using a physical keyboard) open the page as `http://localhost:3000/?kb=off`.
