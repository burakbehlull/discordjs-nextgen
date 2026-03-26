import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { GATEWAY_URL, GatewayOpcodes } from '../types/constants';
import type { PresenceData } from '../types/raw';

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

      if (code !== 1000) {
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
        if (!resumable) {
          this.sessionId = null;
          this.resumeUrl = null;
        }
        setTimeout(() => this.reconnect(), 1000 + Math.random() * 4000);
        break;
      }

      case GatewayOpcodes.DISPATCH:
        if (t) this.handleEvent(t, d);
        break;
    }
  }

  private handleEvent(event: string, data: unknown): void {
    if (event === 'READY') {
      const d = data as { session_id: string; resume_gateway_url: string; user: unknown };
      this.sessionId = d.session_id;
      this.resumeUrl = d.resume_gateway_url + '?v=10&encoding=json';
    }
    this.emit('dispatch', event, data);
  }

  private identify(): void {
    this.send({
      op: GatewayOpcodes.IDENTIFY,
      d: {
        token: this.token,
        intents: this.options.intents,
        properties: {
          os: process.platform,
          browser: 'discordjs-nextgen',
          device: 'discordjs-nextgen',
        },
        presence: this.options.presence,
      },
    });
  }

  private resume(): void {
    this.send({
      op: GatewayOpcodes.RESUME,
      d: {
        token: this.token,
        session_id: this.sessionId,
        seq: this.sequence,
      },
    });
  }

  private startHeartbeat(interval: number): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    setTimeout(() => {
      this.sendHeartbeat();
      this.heartbeatInterval = setInterval(() => {
        if (!this.lastHeartbeatAck) {
          this.reconnect();
          return;
        }
        this.lastHeartbeatAck = false;
        this.sendHeartbeat();
      }, interval);
    }, interval * Math.random());
  }

  private sendHeartbeat(): void {
    this.send({ op: GatewayOpcodes.HEARTBEAT, d: this.sequence });
  }

  private reconnect(): void {
    if (this.reconnecting) return;
    this.reconnecting = true;
    this.cleanup();
    this.connect();
  }

  private cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.ws) {
      this.ws.removeAllListeners();
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  private shouldResume(code: number): boolean {
    const nonResumableCodes = [4004, 4010, 4011, 4012, 4013, 4014];
    return !nonResumableCodes.includes(code);
  }

  send(payload: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  updatePresence(presence: PresenceData): void {
    this.send({
      op: GatewayOpcodes.PRESENCE_UPDATE,
      d: {
        since: presence.status === 'idle' ? Date.now() : null,
        activities: presence.activities ?? [],
        status: presence.status ?? 'online',
        afk: presence.afk ?? false,
      },
    });
  }

  destroy(): void {
    this.sessionId = null;
    this.resumeUrl = null;
    this.cleanup();
  }
}
