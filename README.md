# PlayDeck — Board, Arcade & Daily Games

A relaxed, modern game room with **13 classic strategy, arcade, and daily games** in one responsive React + TypeScript app, ready to deploy on Vercel.

## Included Games

### Morris Family
- **Three Men's Morris** — 3×3 grid with orthogonal & diagonal lines, placement and sliding
- **Six Men's Morris** — 16-node dual-square board with mill captures
- **Nine Men's Morris** — Classic 24-node triple-square board with placement, sliding, flying, and mill captures
- **Twelve Men's Morris (Morabaraba)** — 24-node board with corner diagonals and 12 pieces per player

### Classic Strategy
- **Connect Four** — 7×6 gravity-drop tactical 4-in-a-row
- **Reversi (Othello)** — 8×8 flanking & disc-flipping strategy
- **Checkers (Draughts)** — 8×8 diagonal advances, mandatory captures, multi-jumps, and Kings
- **Mancala (Kalah)** — Ancient count-and-sow pit game with extra turns & opposite-pit captures
- **Gomoku** — 15×15 five-in-a-row intersection strategy
- **Dots & Boxes** — 5×5 dot grid with edge drawing, box claiming, and chain tactics

### Arcade & Daily Games
- **2048** — Slide tiles together, swipe on phones, and keep a saved personal best
- **Minesweeper** — A compact 9×9 puzzle with a safe first reveal and touch-friendly flag mode
- **Word Guess** — A five-letter daily puzzle with six tries, keyboard input, and on-screen keys

## Features
- **Play vs AI** (Easy / Medium / Hard), **Local 2-Player** pass-and-play, solo arcade games, or invite a friend to a live match
- **Online Rooms** with a short room code, QR code, and shareable invite link
- **Find Nearby** to list games hosted on the same Wi-Fi or hotspot, then connect directly device-to-device
- **Offline QR Pairing** as a no-internet fallback for nearby devices
- **Light / Dark Mode**: Paper & Ink for light mode and Carbon Ember for dark mode, inspired by StackDome's warm charcoal and ember palette
- **Full Undo Support**, **Interactive Rules Modal**, and **Web Audio Tactile Sound Effects**
- **Responsive Design** with custom crisp SVG boards for desktop and mobile
- **Direct game links** at `/play/<game-id>` with browser back and forward navigation
- **Automatic local saves** for in-progress solo and pass-and-play matches, plus theme, sound, and difficulty preferences

Progress and preferences stay in versioned browser storage on the current device. 2048 also keeps a separate personal best across new rounds. Online matches are never saved locally. Use the library’s **Continue** action to resume the most recent saved match.

## Multiplayer Notes

- **Find Nearby** uses a short-lived lobby on the deployed site to list games on the same public network address (or IPv6 network prefix). Both devices need internet access to discover one another; gameplay then uses a direct WebRTC connection with local network candidates. Listings expire after a minute, and only the host can remove one. The API stores a keyed hash of the network address rather than the raw address. This is network discovery, not Bluetooth-range discovery, so devices behind the same shared public network may also see one another.
- **Offline QR Pairing** works without the lobby or internet. Put both devices on the same Wi-Fi or hotspot, scan the host offer QR, then let the host scan the reply QR. Camera access is requested only when scanning; pairing codes are decoded on-device. Some hotspot networks block direct device-to-device traffic.
- **Online Rooms** use PeerJS signaling and WebRTC to connect players over the internet. Room codes are temporary; keep the host page open until the other player joins. Matches are not saved as rooms or listed publicly.

## Configure Nearby Discovery on Vercel

The app itself is static, but Find Nearby needs a small serverless API and a Redis-backed presence store. Create an Upstash Redis database, then add these environment variables to the Vercel project for **Production**, **Preview**, and **Development** as needed:

| Variable | Value |
| --- | --- |
| `UPSTASH_REDIS_REST_URL` | Upstash database REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash database REST token |
| `BOARDCRAFT_NEARBY_SECRET` | A private random secret; generate one with `openssl rand -hex 32` |

Redeploy after adding the variables. `Online Rooms` and offline QR pairing do not depend on Redis. Without the variables, the Nearby screen shows a setup error and still offers offline QR pairing.

For local API development, use the Vercel CLI (`npx vercel dev`) so `/api/nearby` runs alongside Vite. `npm run dev` alone serves the client only.

## Local Development

```bash
npm install
npm run dev
```

## Build & Test

```bash
npm test
npm run build
```

## Deploy to Vercel

Import this repository into [Vercel](https://vercel.com) — `vercel.json` is preconfigured for Vite builds and the `/api/nearby` serverless function.
