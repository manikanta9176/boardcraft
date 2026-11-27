import Peer, { DataConnection } from 'peerjs';
import { NetMessage, roomToPeerId } from './types';

export interface PeerCallbacks {
  onWaiting?: () => void;
  onConnected: () => void;
  onMessage: (msg: NetMessage) => void;
  onDisconnected: (reason?: string) => void;
  onError: (message: string) => void;
}

export interface ActiveTransport {
  send: (msg: NetMessage) => void;
  close: () => void;
}

export function hostOnlineRoom(code: string, cb: PeerCallbacks): ActiveTransport {
  const peerId = roomToPeerId(code);
  const peer = new Peer(peerId, { debug: 0 });
  let activeConn: DataConnection | null = null;
  let closed = false;

  const wireConn = (conn: DataConnection) => {
    activeConn = conn;
    conn.on('open', () => {
      if (!closed) cb.onConnected();
    });
    conn.on('data', (data) => {
      if (!closed && data && typeof data === 'object' && 'type' in data) {
        cb.onMessage(data as NetMessage);
      }
    });
    conn.on('close', () => {
      if (activeConn === conn) activeConn = null;
      if (!closed) cb.onDisconnected('Opponent left the room');
    });
    conn.on('error', (err) => {
      if (!closed) cb.onError(err.message || 'Connection error');
    });
  };

  peer.on('open', () => {
    if (!closed) cb.onWaiting?.();
  });

  peer.on('connection', (conn) => {
    if (activeConn) {
      conn.close();
      return;
    }
    wireConn(conn);
  });

  peer.on('error', (err) => {
    if (closed) return;
    if (err.type === 'unavailable-id') {
      cb.onError('Room code is already in use. Please try generating a new one.');
    } else {
      cb.onError(err.message || 'Could not reach room signaling server.');
    }
  });

  return {
    send: (msg) => {
      if (activeConn?.open) {
        activeConn.send(msg);
      }
    },
    close: () => {
      closed = true;
      activeConn?.close();
      peer.destroy();
    },
  };
}

export function joinOnlineRoom(code: string, cb: PeerCallbacks): ActiveTransport {
  const targetPeerId = roomToPeerId(code);
  const peer = new Peer({ debug: 0 });
  let activeConn: DataConnection | null = null;
  let closed = false;
  let connectedOnce = false;

  const timeout = window.setTimeout(() => {
    if (!connectedOnce && !closed) {
      cb.onError('Room timed out. Double-check the code or ask the host to recreate the room.');
      peer.destroy();
    }
  }, 14000);

  peer.on('open', () => {
    if (closed) return;
    const conn = peer.connect(targetPeerId, { reliable: true });
    activeConn = conn;

    conn.on('open', () => {
      connectedOnce = true;
      window.clearTimeout(timeout);
      if (!closed) cb.onConnected();
    });

    conn.on('data', (data) => {
      if (!closed && data && typeof data === 'object' && 'type' in data) {
        cb.onMessage(data as NetMessage);
      }
    });

    conn.on('close', () => {
      window.clearTimeout(timeout);
      if (!closed) cb.onDisconnected('Host closed the room');
    });

    conn.on('error', (err) => {
      window.clearTimeout(timeout);
      if (!closed) cb.onError(err.message || 'Connection failed');
    });
  });

  peer.on('error', (err) => {
    window.clearTimeout(timeout);
    if (closed) return;
    if (err.type === 'peer-unavailable') {
      cb.onError('Room not found. Verify the 6-character code with the host.');
    } else {
      cb.onError(err.message || 'Unable to join room.');
    }
  });

  return {
    send: (msg) => {
      if (activeConn?.open) {
        activeConn.send(msg);
      }
    },
    close: () => {
      closed = true;
      window.clearTimeout(timeout);
      activeConn?.close();
      peer.destroy();
    },
  };
}
