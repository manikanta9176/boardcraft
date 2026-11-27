# BoardCraft — Classic Strategy & Morris Board Games

A clean, modern collection of **10 classic abstract strategy board games** in a single fast React + TypeScript + Tailwind CSS application—ready for one-click deployment on Vercel.

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

## Features
- **Play vs AI** (Easy / Medium / Hard), **Local 2-Player** pass-and-play, or invite a friend to a live match
- **Online Rooms** with a short room code, QR code, and shareable invite link
- **Local Wi-Fi / Hotspot Pairing** with manually exchanged offer and answer codes for devices on the same network
- **2 Dark Tabletop Themes**: Carbon Ember, inspired by StackDome's warm charcoal and ember palette, and Midnight Felt
- **Full Undo Support**, **Interactive Rules Modal**, and **Web Audio Tactile Sound Effects**
- **Responsive Design** with custom crisp SVG boards for desktop and mobile
- **Direct game links** at `/play/<game-id>` with browser back and forward navigation
- **Automatic local saves** for in-progress solo and pass-and-play matches, plus theme, sound, and difficulty preferences

Progress and preferences stay in versioned browser storage on the current device. Online matches are never saved locally. Use the library’s **Continue** action to resume the most recent saved match.

## Multiplayer Notes

- Online rooms use PeerJS signaling to find one another and WebRTC data channels to exchange moves. No BoardCraft account or application server is required. The browser may use STUN/TURN services to establish a connection, and some network settings can prevent a match from connecting.
- Local pairing uses WebRTC host candidates only. Put both devices on the same Wi-Fi or hotspot, then exchange the offer and answer codes. Some hotspot networks block traffic between connected devices.
- Room codes are temporary. Keep the host page open until the other player joins; rooms are not saved or listed publicly.

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

Import this repository into [Vercel](https://vercel.com) — `vercel.json` is preconfigured for Vite static builds.
