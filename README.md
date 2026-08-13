# LandingPage_Test

Landing Page im Look eines Fahrzeug-Infotainment-Homescreens. Die Kachel
**"Hilfe & Kontakt"** startet per Klick einen Voice-Call mit dem Cognigy
VoiceBot ("Ida - AI Agent") über WebRTC (Cognigy VoiceGateway / Click-to-Call
Widget).

## Dateien

- `index.html` – Struktur der Seite (Topbar, Kachel-Grid, Bottombar)
- `style.css` – Optik (dunkles Dashboard-Theme, Kacheln, Badges, rote
  Hervorhebung von "Hilfe & Kontakt")
- `script.js` – Bindet das Cognigy WebRTC Click-to-Call Widget ein und
  verknüpft den Klick auf die Kachel mit dem Start-/Endanruf-Button des
  Widgets
- `auth.js` – Einfache clientseitige Zugangscode-Hürde (siehe unten)

## Zugangsschutz

Die Seite verlangt vor der Anzeige einen Zugangscode (Bildschirm "Zugriff
geschützt"). **Wichtig:** GitHub Pages liefert nur statische Dateien ohne
Server-Backend aus. Dieser Schutz ist daher eine reine Client-seitige Hürde
gegen zufälliges/versehentliches Öffnen der Seite – der Seitenquelltext
(`auth.js`) ist für jeden einsehbar, wodurch sich der Check technisch
umgehen lässt. Für einen echten Zugriffsschutz wird ein vorgeschalteter
Auth-Layer benötigt (z. B. Cloudflare Access) oder ein Hosting mit
serverseitiger Logik.

Der aktuell hinterlegte Zugangscode: `u76ZT073n08NUeFh3FzH`

Zwei Wege, ihn zu verwenden:

1. Direkt auf der Seite im Feld "Zugangscode" eingeben
2. Per Link mit Query-Parameter teilen, z. B.
   `https://k-ida.poc.demo.de/?token=u76ZT073n08NUeFh3FzH` – entsperrt
   automatisch und entfernt den Token danach aus der URL

Nach erfolgreicher Eingabe bleibt die Seite für die Dauer der Browser-Session
(`sessionStorage`) entsperrt. Um den Code zu ändern: neuen Code wählen, den
SHA-256-Hash bilden (z. B. `python3 -c "import hashlib;
print(hashlib.sha256(b'NEUER_CODE').hexdigest())"`) und `TOKEN_HASH` in
`auth.js` ersetzen.

## Cognigy-Anbindung

In `script.js` ist der VoiceGateway-Endpoint der Cognigy-Umgebung
`trial.cognigy.ai` (Flow "Ida - AI Agent") hinterlegt:

```js
var ENDPOINT_URL = "https://endpoint-trial.cognigy.ai/<token>/voiceGateway";
```

Das Widget-Skript wird über den offiziellen Cognigy-Release-Link eingebunden:

```html
<script src="https://github.com/Cognigy/click-to-call-widget/releases/latest/download/webRTCWidget.js"></script>
```

Beim Laden der Seite wird `window.initWebRTCWidget(ENDPOINT_URL, options)`
aufgerufen. Das Widget rendert dabei seine eigenen (unsichtbar geschalteten)
Steuerelemente in den DOM; unsere "Hilfe & Kontakt"-Kachel leitet Klicks an
die echten Call-/End-Call-Buttons des Widgets weiter, damit Cognigy die
Mikrofonfreigabe und SIP-Session steuert, während unser eigenes
Kachel-Design sichtbar bleibt.

Soll ein anderer Endpoint verwendet werden, einfach `ENDPOINT_URL` in
`script.js` anpassen.

## Hosting

Cognigy hostet nur die Endpoint-Konfiguration (liefert das Embed-Skript),
nicht die komplette Landing Page. Diese Seite ist rein statisch (kein
Build-Schritt nötig) und kann z. B. per **GitHub Pages** direkt aus diesem
Repository gehostet werden:

1. Repository-Einstellungen → *Pages* → Branch auswählen (z. B. `main`) und
   Root-Verzeichnis (`/`) als Quelle setzen
2. Die Seite ist danach unter der GitHub-Pages-URL erreichbar

Alternativ kann sie auf jedem beliebigen statischen Webhost (Netlify,
Vercel, eigener Webserver, S3 etc.) deployt werden – es müssen lediglich
`index.html`, `style.css` und `script.js` zusammen bereitgestellt werden.

### Eigene Domain (k-ida.poc.demo.de)

Die Datei `CNAME` im Repo-Root ist bereits auf `k-ida.poc.demo.de` gesetzt.
Damit die Domain funktioniert, zusätzlich nötig:

1. Beim DNS-Provider der Domain einen **CNAME-Eintrag** anlegen:
   `k-ida.poc.demo.de` → `patpa96.github.io`
2. In den Repository-Einstellungen unter *Pages* die Custom Domain
   `k-ida.poc.demo.de` eintragen (übernimmt GitHub i. d. R. automatisch aus
   der `CNAME`-Datei) und auf DNS-Check warten
3. "Enforce HTTPS" aktivieren, sobald das Zertifikat ausgestellt wurde

Die Seite ist danach unter **https://k-ida.poc.demo.de** erreichbar.

## Lokal testen

```bash
python3 -m http.server 8000
```

Danach `http://localhost:8000` im Browser öffnen. Für den echten Voice-Call
ist eine Internetverbindung zum Cognigy-Endpoint sowie Mikrofonzugriff im
Browser nötig.
