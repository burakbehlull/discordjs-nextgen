import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { GATEWAY_URL, GatewayOpcodes } from '../types/constants.js';
import type { PresenceData } from '../types/raw.js';

export interface GatewayOptions {
  intents: number;
  presence?: PresenceData;
}

export class Gateway extends EventEmitter {
  private ws: WebSocket | null = null;
  private token: string;
  private options: GatewayOptions;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private sequence: number | null = null;
  private sessionId: string | null = null;
  private resumeUrl: string | null = null;
  private lastHeartbeatAck = true;
  private reconnecting = false;
  private destroyed = false;

  constructor(token: string, options: GatewayOptions) {
    super();
    this.token = token;
    this.options = options;
  }

  private readonly fatalCodes: Record<number, string> = {
    4004: 'Authentication failed: Token geçersiz veya yanlış.',
    4010: 'Invalid shard: Geçersiz shard.',
    4011: 'Sharding required.',
    4012: 'Invalid API version.',
    4013: 'Invalid intents.',
    4014: 'Disallowed intents: Privileged intent aktif edilmemiş.',
  };

  connect(): void {
    const url = this.resumeUrl ?? GATEWAY_URL;
    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      this.reconnecting = false;
    });

    this.ws.on('message', (data: Buffer) => {
      const payload = JSON.parse(data.toString());
      this.handlePayload(payload);
    });

    this.ws.on('close', (code) => {
      this.cleanup();

      if (this.fatalCodes[code]) {
        this.emit('error', new Error(`[Gateway] ${this.fatalCodes[code]} (kod: ${code})`));
        return;
      }

      if (!this.shouldResume(code)) {
        this.sessionId = null;
        this.resumeUrl = null;
      }

      if (code !== 1000 && !this.destroyed) {
        setTimeout(() => this.reconnect(), 5000);
      }
    });

    this.ws.on('error', (err) => {
      this.emit('error', err);
    });
  }

  private handlePayload(payload: { op: number; d?: unknown; s?: number; t?: string }): void {
    const { op, d, s, t } = payload;

    if (s !== null && s !== undefined) {
      this.sequence = s;
    }

    switch (op) {
      case GatewayOpcodes.HELLO: {
        const data = d as { heartbeat_interval: number };
        this.startHeartbeat(data.heartbeat_interval);
        if (this.sessionId) {
          this.resume();
        } else {
          this.identify();
        }
        break;
      }

      case GatewayOpcodes.HEARTBEAT_ACK:
        this.lastHeartbeatAck = true;
        break;

      case GatewayOpcodes.HEARTBEAT:
        this.sendHeartbeat();
        break;

      case GatewayOpcodes.RECONNECT:
        this.reconnect();
        break;

      case GatewayOpcodes.INVALID_SESSION: {
        const resumable = d as boolean;
        if (resumable) {
          this.reconnect();
        } else {
          this.sessionId = null;
          this.resumeUrl = null;
          this.reconnect();
        }
        break;
      }

      case GatewayOpcodes.DISPATCH:
        if (t === 'READY') {
          const data = d as { session_id: string; resume_gateway_url: string };
          this.sessionId = data.session_id;
          this.resumeUrl = data.resume_gateway_url;
        }
        this.emit('dispatch', t!, d);
        break;
    }
  }

  private identify(): void {
    this.send(GatewayOpcodes.IDENTIFY, {
      token: this.token,
      intents: this.options.intents,
      properties: {
        os: process.platform,
        browser: 'discordjs-nextgen',
        device: 'discordjs-nextgen',
      },
      presence: this.options.presence,
    });
  }

  private resume(): void {
    this.send(GatewayOpcodes.RESUME, {
      token: this.token,
      session_id: this.sessionId,
      seq: this.sequence,
    });
  }

  private startHeartbeat(interval: number): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      if (!this.lastHeartbeatAck) {
        this.reconnect();
        return;
      }
      this.lastHeartbeatAck = false;
      this.sendHeartbeat();
    }, interval);
  }

  private sendHeartbeat(): void {
    this.send(GatewayOpcodes.HEARTBEAT, this.sequence);
  }

  private reconnect(): void {
    if (this.reconnecting) return;
    this.reconnecting = true;
    this.destroy();
    this.connect();
  }

  private send(op: number, d: unknown): void {
    this.sendPayload(op, d);
  }

  sendPayload(op: number, d: unknown): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify({ op, d }));
    return true;
  }

  private shouldResume(code: number): boolean {
    return code !== 1000 && code !== 4007 && code !== 4009;
  }

  private cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  updatePresence(presence: PresenceData): void {
    this.options.presence = presence;
    this.send(GatewayOpcodes.PRESENCE_UPDATE, presence);
  }

  destroy(): void {
    this.destroyed = true;
    this.cleanup();
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
  }
}
