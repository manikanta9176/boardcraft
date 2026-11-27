import { ActiveTransport, PeerCallbacks } from './onlinePeer';
import { NetMessage } from './types';

function encodeSignal(desc: RTCSessionDescriptionInit): string {
  const payload = JSON.stringify({ t: desc.type, s: desc.sdp });
  const bytes = new TextEncoder().encode(payload);
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return 'BC1:' + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeSignal(raw: string): RTCSessionDescriptionInit {
  const clean = raw.trim().replace(/^BC1:/, '').replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(clean);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const json = JSON.parse(new TextDecoder().decode(bytes)) as {
    t: RTCSdpType;
    s: string;
  };
  return { type: json.t, sdp: json.s };
}

function waitForIceGathering(pc: RTCPeerConnection, maxWaitMs = 2200): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      pc.removeEventListener('icegatheringstatechange', onChange);
      resolve();
    }, maxWaitMs);
    const onChange = () => {
      if (pc.iceGatheringState === 'complete') {
        window.clearTimeout(timer);
        pc.removeEventListener('icegatheringstatechange', onChange);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', onChange);
  });
}

function wireChannel(
  pc: RTCPeerConnection,
  dc: RTCDataChannel,
  cb: PeerCallbacks,
): ActiveTransport {
  let closed = false;

  dc.onopen = () => {
    if (!closed) cb.onConnected();
  };
  dc.onmessage = (ev) => {
    if (closed) return;
    try {
      const parsed = JSON.parse(String(ev.data)) as NetMessage;
      if (parsed && typeof parsed === 'object' && 'type' in parsed) {
        cb.onMessage(parsed);
      }
    } catch {
      // Ignore malformed payloads
    }
  };
  dc.onclose = () => {
    if (!closed) cb.onDisconnected('Hotspot P2P link closed');
  };
  pc.onconnectionstatechange = () => {
    if (!closed && (pc.connectionState === 'disconnected' || pc.connectionState === 'failed')) {
      cb.onDisconnected('Hotspot connection lost');
    }
  };

  return {
    send: (msg) => {
      if (dc.readyState === 'open') {
        dc.send(JSON.stringify(msg));
      }
    },
    close: () => {
      closed = true;
      dc.close();
      pc.close();
    },
  };
}

export interface HotspotHostSession {
  offerCode: string;
  acceptAnswer: (answerCode: string) => Promise<void>;
  transport: ActiveTransport;
}

export async function createHotspotHostSession(cb: PeerCallbacks): Promise<HotspotHostSession> {
  // Empty iceServers ensures zero internet dependency—uses local LAN/Hotspot host candidates
  const pc = new RTCPeerConnection({ iceServers: [] });
  const dc = pc.createDataChannel('boardcraft', { ordered: true });
  const transport = wireChannel(pc, dc, cb);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await waitForIceGathering(pc);

  const offerCode = encodeSignal(pc.localDescription!);

  return {
    offerCode,
    transport,
    acceptAnswer: async (answerCode: string) => {
      const answer = decodeSignal(answerCode);
      await pc.setRemoteDescription(answer);
    },
  };
}

export interface HotspotGuestSession {
  answerCode: string;
  transport: ActiveTransport;
}

export async function joinHotspotOffer(
  offerCode: string,
  cb: PeerCallbacks,
): Promise<HotspotGuestSession> {
  const pc = new RTCPeerConnection({ iceServers: [] });
  const offer = decodeSignal(offerCode);

  let transportRef: ActiveTransport | null = null;
  let closed = false;

  pc.ondatachannel = (ev) => {
    transportRef = wireChannel(pc, ev.channel, cb);
  };

  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await waitForIceGathering(pc);

  const answerCode = encodeSignal(pc.localDescription!);

  const proxyTransport: ActiveTransport = {
    send: (msg) => transportRef?.send(msg),
    close: () => {
      closed = true;
      if (transportRef) transportRef.close();
      else pc.close();
    },
  };

  pc.onconnectionstatechange = () => {
    if (!closed && (pc.connectionState === 'disconnected' || pc.connectionState === 'failed')) {
      cb.onDisconnected('Hotspot connection lost');
    }
  };

  return {
    answerCode,
    transport: proxyTransport,
  };
}
