import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { GATEWAY_URL, GatewayOpcodes } from '../types/constants.js';
export class Gateway extends EventEmitter {
    constructor(token, options) {
        super();
        this.ws = null;
        this.heartbeatInterval = null;
        this.sequence = null;
        this.sessionId = null;
        this.resumeUrl = null;
        this.lastHeartbeatAck = true;
        this.reconnecting = false;
        this.fatalCodes = {
            4004: 'Authentication failed: Token geçersiz veya yanlış.',
            4010: 'Invalid shard: Geçersiz shard.',
            4011: 'Sharding required.',
            4012: 'Invalid API version.',
            4013: 'Invalid intents.',
            4014: 'Disallowed intents: Privileged intent aktif edilmemiş.',
        };
        this.token = token;
        this.options = options;
    }
    connect() {
        const url = this.resumeUrl ?? GATEWAY_URL;
        this.ws = new WebSocket(url);
        this.ws.on('open', () => {
            this.reconnecting = false;
        });
        this.ws.on('message', (data) => {
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
    handlePayload(payload) {
        const { op, d, s, t } = payload;
        if (s !== null && s !== undefined) {
            this.sequence = s;
        }
        switch (op) {
            case GatewayOpcodes.HELLO: {
                const data = d;
                this.startHeartbeat(data.heartbeat_interval);
                if (this.sessionId) {
                    this.resume();
                }
                else {
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
                const resumable = d;
                if (resumable) {
                    this.reconnect();
                }
                else {
                    this.sessionId = null;
                    this.resumeUrl = null;
                    this.reconnect();
                }
                break;
            }
            case GatewayOpcodes.DISPATCH:
                if (t === 'READY') {
                    const data = d;
                    this.sessionId = data.session_id;
                    this.resumeUrl = data.resume_gateway_url;
                }
                this.emit('dispatch', t, d);
                break;
        }
    }
    identify() {
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
    resume() {
        this.send(GatewayOpcodes.RESUME, {
            token: this.token,
            session_id: this.sessionId,
            seq: this.sequence,
        });
    }
    startHeartbeat(interval) {
        if (this.heartbeatInterval)
            clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(() => {
            if (!this.lastHeartbeatAck) {
                this.reconnect();
                return;
            }
            this.lastHeartbeatAck = false;
            this.sendHeartbeat();
        }, interval);
    }
    sendHeartbeat() {
        this.send(GatewayOpcodes.HEARTBEAT, this.sequence);
    }
    reconnect() {
        if (this.reconnecting)
            return;
        this.reconnecting = true;
        this.destroy();
        this.connect();
    }
    send(op, d) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ op, d }));
        }
    }
    shouldResume(code) {
        return code !== 1000 && code !== 4007 && code !== 4009;
    }
    cleanup() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    updatePresence(presence) {
        this.options.presence = presence;
        this.send(GatewayOpcodes.PRESENCE_UPDATE, presence);
    }
    destroy() {
        this.cleanup();
        if (this.ws) {
            this.ws.removeAllListeners();
            this.ws.close();
            this.ws = null;
        }
    }
}
//# sourceMappingURL=Gateway.js.map