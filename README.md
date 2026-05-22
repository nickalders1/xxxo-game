# XXXo The Game

Strategische 5×5 tic-tac-toe variant. Maak 4 of 5 op een rij om punten te scoren. Plaats nooit naast je eigen laatste zet. Hoogste score wint.

Drie speelmodi:

- **Lokaal** — twee spelers op één apparaat
- **AI** — tegen de computer, drie moeilijkheidsgraden
- **Online** — realtime matchmaking via Socket.IO

---

## Architectuur

De app bestaat uit **twee processen** die naast elkaar draaien:

| Proces | Wat | Poort | Bron |
| --- | --- | --- | --- |
| `web` | Next.js frontend (app router) | `3000` | Next.js build |
| `socket` | Realtime multiplayer server | `3001` | [socket-server.js](socket-server.js) |

De web-app praat met de socket server vanuit de browser. In productie zit er een reverse proxy (nginx) voor beide processen die SSL termineert en het WebSocket pad doorzet.

**Tech stack:** Next.js 15, React 19, TypeScript strict, Tailwind 4, shadcn/ui, Socket.IO 4, Vitest.

---

## Lokaal ontwikkelen

### Voorwaarden

- Node.js 20 LTS (of 22)
- npm 10+
- Git

### Installatie

```bash
git clone https://github.com/Odsko/xxxo-game.git
cd xxxo-game
npm install
```

### Starten

Eén commando start beide processen tegelijk (web op `:3000`, socket op `:3001`):

```bash
npm run dev:full
```

Open daarna [http://localhost:3000](http://localhost:3000).

Wil je ze los starten (twee terminals)?

```bash
npm run dev      # alleen Next.js (3000)
npm run socket   # alleen socket server (3001)
```

> De client kiest de socket URL automatisch: lokaal pakt hij `http://localhost:3001`, in productie gaat hij via de huidige `https://` origin. Override met `NEXT_PUBLIC_SOCKET_URL` als je iets anders wilt.

### Productiebuild lokaal proberen

```bash
npm run build
npm start          # web op 3000
node socket-server.js   # socket op 3001 (los terminal)
```

---

## Testen

### Unit tests

De game regels (scoring, bewegingsbeperking, bonus turn, AI) zitten in `src/lib/game/` en zijn volledig pure functions, gedekt door Vitest.

```bash
npm test           # one-shot run
npm run test:watch # watch mode
```

42 tests pinnen het scoringsysteem en de regels vast — zie [src/lib/game/__tests__/](src/lib/game/__tests__/).

### Handmatig testen (lokale modi)

Met `npm run dev:full` draaiend:

1. **Lokaal PvP** — `/game?mode=local` — twee spelers op één scherm.
2. **AI** — `/game?mode=ai` — wissel difficulty via de selector rechtsboven.
3. **Regels** — `/rules` — visuele uitleg en voorbeeldbord.

Punten om op te letten:

- Cellen direct naast je laatste zet (alle 8 om je heen) moeten visueel disabled zijn.
- De laatste zet van X en O hebben een subtiele ring om de cel.
- AI denkt 0,4–1,3 sec per zet afhankelijk van difficulty.
- Bij gelijke stand toont de winner-banner "Gelijkspel!".

### Handmatig testen (online modus)

Open twee browser tabs (of een tab + privé-venster) naar [http://localhost:3000/online](http://localhost:3000/online):

1. Vul in tab 1 een speler-naam in en klik **Zoek spel**.
2. Doe hetzelfde in tab 2 met een andere naam.
3. De matchmaker koppelt jullie en stuurt beide tabs door naar `/online/game?id=...`.
4. Speel om en om — je ziet realtime updates.

Lukt de matchmaking niet? Controleer of de socket server draait (de lobby toont "Verbonden" linksboven) en of poort 3001 niet door iets anders bezet is.

---

## Productie deployment (Ubuntu VM)

De huidige productie staat op een Linux VM achter een reverse proxy. Onderstaande stappen reproduceren die opstelling vanaf nul.

### 1. VM voorbereiden

Werk een Ubuntu 22.04 of 24.04 LTS server bij en installeer de basis-pakketten:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential ufw
```

### 2. Node.js 20 LTS installeren

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # zou 20.x moeten zijn
npm -v
```

### 3. Dedicated user + clone

De PM2 config gebruikt `/home/xxxo/xxxo-game` — maak een aparte gebruiker zodat de app niet onder root draait:

```bash
sudo adduser --disabled-password --gecos "" xxxo
sudo -iu xxxo
git clone https://github.com/Odsko/xxxo-game.git
cd xxxo-game
npm ci
npm run build
```

### 4. PM2 installeren en starten

Als je nog steeds als `xxxo` ingelogd bent:

```bash
npm install -g pm2          # of: sudo npm install -g pm2 (eenmalig, globaal)
pm2 start ecosystem.config.js
pm2 save
```

Zorg dat PM2 automatisch opstart na een reboot — voer als root het commando uit dat `pm2 startup` voorstelt:

```bash
pm2 startup
# kopieer en run het sudo-commando dat hij teruggeeft
```

Check de status:

```bash
pm2 status                  # zou 'web' en 'socket' online moeten tonen
pm2 logs web --lines 30
pm2 logs socket --lines 30
```

[ecosystem.config.js](ecosystem.config.js) bindt de web app aan `127.0.0.1:3000` (alleen lokaal bereikbaar — de reverse proxy doet het publieke werk) en de socket server aan `:3001`.

### 5. Reverse proxy (nginx) configureren

```bash
sudo apt install -y nginx
```

### Cloudflare instellingen (vooraf — eenmalig)

Omdat het domain via Cloudflare proxied is, configureer eerst Cloudflare:

1. **SSL/TLS → Overview** → zet op **Full (strict)** (niet Flexible — dat geeft redirect loops).
2. **SSL/TLS → Origin Server → Create Certificate** → laat alle defaults staan → **Create**. Cloudflare geeft je een certificaat en private key (15 jaar geldig, geen vernieuwing nodig).
3. Op je VM, sla beide op:
   ```bash
   sudo mkdir -p /etc/ssl/cloudflare
   sudo nano /etc/ssl/cloudflare/xxxo-game.com.crt   # plak het certificate hier
   sudo nano /etc/ssl/cloudflare/xxxo-game.com.key   # plak de private key hier
   sudo chmod 600 /etc/ssl/cloudflare/xxxo-game.com.key
   ```
4. **DNS → Records** → zorg dat zowel `@` als `www` (CNAME → `xxxo-game.com`) bestaan, beide met proxy aan (oranje wolkje).
5. **Network → WebSockets** → aan (default, maar dubbel-check).

Maak daarna `/etc/nginx/sites-available/xxxo`:

```nginx
server {
    listen 80;
    server_name xxxo-game.com www.xxxo-game.com;
    return 301 https://xxxo-game.com$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.xxxo-game.com;

    ssl_certificate     /etc/ssl/cloudflare/xxxo-game.com.crt;
    ssl_certificate_key /etc/ssl/cloudflare/xxxo-game.com.key;

    return 301 https://xxxo-game.com$request_uri;
}

server {
    listen 443 ssl http2;
    server_name xxxo-game.com;

    ssl_certificate     /etc/ssl/cloudflare/xxxo-game.com.crt;
    ssl_certificate_key /etc/ssl/cloudflare/xxxo-game.com.key;

    # Socket.IO: WebSocket upgrade naar de socket server (poort 3001)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Al het andere: naar de Next.js app (poort 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    client_max_body_size 5m;
}
```

Activeren + reloaden:

```bash
sudo ln -s /etc/nginx/sites-available/xxxo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Geen Certbot nodig — Cloudflare Origin certificaat is 15 jaar geldig.

### 6. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

De poorten 3000 en 3001 **niet** open zetten — alleen nginx praat ermee.

### 7. Eerste test

Vanaf je laptop:

```bash
curl -I https://xxxo-game.com
# moet HTTP/2 200 teruggeven
```

Open de site in een browser en speel een AI-partij. Open dan twee tabs op `/online` om matchmaking te valideren.

---

## Updaten / herdeployen

Op de VM, als gebruiker `xxxo`:

```bash
cd ~/xxxo-game
git pull
npm ci
npm run build
pm2 reload ecosystem.config.js
```

`pm2 reload` doet zero-downtime restart van de web app. De socket server herstart wel even (sessies vallen weg), dus communiceer dat naar actieve spelers als het uitkomt.

---

## Project structuur

```
src/
  app/                      Next.js routes (home, game, online, rules)
  components/
    game/                   Board, Cell, ScoreCard, GameStatus, ...
    layout/                 AppShell, TopBar
    ui/                     shadcn primitives (button, card, input, select)
  hooks/                    useLocalGame, useAIGame
  lib/
    game/                   Pure game logic + Vitest tests
      __tests__/            Scoring, rules, AI unit tests
    socket.ts               Socket.IO singleton for the browser
    utils.ts                cn() helper
socket-server.js            Standalone Socket.IO server (port 3001)
ecosystem.config.js         PM2 configuration (web + socket processes)
```

De volledige game regels en AI minimax zitten in [src/lib/game/](src/lib/game/) en zijn zonder React te testen — handig als je later de socket server wilt laten delen in dezelfde logic.

---

## Veelvoorkomende problemen

**"Connection lost" in de online lobby**
Socket server draait niet of nginx heeft `/socket.io/` niet goed proxied. Check `pm2 logs socket` en het nginx upgrade-blok hierboven.

**Build faalt met "next not found"**
`npm install` is niet (helemaal) gelukt. Run `rm -rf node_modules package-lock.json && npm install`.

**Vitest faalt met "Failed to load PostCSS config"**
[vitest.config.ts](vitest.config.ts) heeft een override (`css.postcss.plugins = []`) omdat Vitest anders de Tailwind 4 PostCSS plugin probeert te laden. Niet weghalen.

**PM2 zegt "online" maar de site geeft 502**
Web app crasht direct na start. `pm2 logs web --lines 100` om de stacktrace te zien. Meestal een ontbrekende env var — `NEXT_PUBLIC_SOCKET_URL` is optioneel maar wordt aanbevolen in productie zoals in [ecosystem.config.js](ecosystem.config.js).

---

## Volgende stappen

- **PWA installable maken** (manifest, service worker via `serwist`) — staat klaar als optionele Phase 4.
- **Native app via Capacitor** met remote-URL strategie, zodat dezelfde codebase als Android/iOS app draait — Phase 5.

Beide zijn niet vereist om de game in productie te draaien.
