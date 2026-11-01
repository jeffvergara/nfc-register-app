/*
  NFC reader for the registration web app
  Board:   Arduino Uno / Nano / Mega (or ESP32)
  Reader:  PN532 NFC module (I2C mode)
  Library: "Adafruit PN532" (Library Manager) + "Adafruit BusIO"

  Wiring (Uno, I2C mode — set the PN532 DIP switches to I2C):
    PN532 VCC -> 5V      PN532 GND -> GND
    PN532 SDA -> A4      PN532 SCL -> A5

  The sketch prints one line per card:   UID:04A1B2C3D4E580
  The web page reads these lines over USB (Web Serial, 115200 baud).
*/
#include <Wire.h>
#include <Adafruit_PN532.h>

// I2C: IRQ and RESET pins are optional (-1 when unused)
#define PN532_IRQ   (2)
#define PN532_RESET (3)
Adafruit_PN532 nfc(PN532_IRQ, PN532_RESET);

unsigned long lastScan = 0;
String lastUid = "";

void setup() {
  Serial.begin(115200);
  nfc.begin();
  if (!nfc.getFirmwareVersion()) {
    Serial.println("ERROR: PN532 not found - check wiring and I2C mode switches");
    while (1) delay(10);
  }
  nfc.SAMConfig();
  Serial.println("READY");
}

void loop() {
  uint8_t uid[7];
  uint8_t uidLength;
  // Wait up to 100 ms for an ISO14443A card (Mifare, NTAG, etc.)
  if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 100)) {
    String s = "";
    for (uint8_t i = 0; i < uidLength; i++) {
      if (uid[i] < 0x10) s += "0";
      s += String(uid[i], HEX);
    }
    s.toUpperCase();
    // Avoid flooding: same card is re-sent at most every 1.5 s
    if (s != lastUid || millis() - lastScan > 1500) {
      Serial.print("UID:");
      Serial.println(s);
      lastUid = s;
      lastScan = millis();
    }
  }
}
