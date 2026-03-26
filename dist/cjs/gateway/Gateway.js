"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gateway = void 0;
const ws_1 = __importDefault(require("ws"));
const events_1 = require("events");
const constants_1 = require("../types/constants");
class Gateway extends events_1.EventEmitter {
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
        const url = this.resumeUrl ?? constants_1.GATEWAY_URL;
        this.ws = new ws_1.default(url);
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
            case constants_1.GatewayOpcodes.HELLO: {
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
            case constants_1.GatewayOpcodes.HEARTBEAT_ACK:
                this.lastHeartbeatAck = true;
                break;
            case constants_1.GatewayOpcodes.HEARTBEAT:
                this.sendHeartbeat();
                break;
            case constants_1.GatewayOpcodes.RECONNECT:
                this.reconnect();
                break;
            case constants_1.GatewayOpcodes.INVALID_SESSION: {
                const resumable = d;
                if (!resumable) {
                    this.sessionId = null;
                    this.resumeUrl = null;
                }
                setTimeout(() => this.reconnect(), 1000 + Math.random() * 4000);
                break;
            }
            case constants_1.GatewayOpcodes.DISPATCH:
                if (t)
                    this.handleEvent(t, d);
                break;
        }
    }
    handleEvent(event, data) {
        if (event === 'READY') {
            const d = data;
            this.sessionId = d.session_id;
            this.resumeUrl = d.resume_gateway_url + '?v=10&encoding=json';
        }
        this.emit('dispatch', event, data);
    }
    identify() {
        this.send({
            op: constants_1.GatewayOpcodes.IDENTIFY,
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
    resume() {
        this.send({
            op: constants_1.GatewayOpcodes.RESUME,
            d: {
                token: this.token,
                session_id: this.sessionId,
                seq: this.sequence,
            },
        });
    }
    startHeartbeat(interval) {
        if (this.heartbeatInterval)
            clearInterval(this.heartbeatInterval);
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
    sendHeartbeat() {
        this.send({ op: constants_1.GatewayOpcodes.HEARTBEAT, d: this.sequence });
    }
    reconnect() {
        if (this.reconnecting)
            return;
        this.reconnecting = true;
        this.cleanup();
        this.connect();
    }
    cleanup() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.ws) {
            this.ws.removeAllListeners();
            if (this.ws.readyState === ws_1.default.OPEN) {
                this.ws.close();
            }
            this.ws = null;
        }
    }
    shouldResume(code) {
        const nonResumableCodes = [4004, 4010, 4011, 4012, 4013, 4014];
        return !nonResumableCodes.includes(code);
    }
    send(payload) {
        if (this.ws?.readyState === ws_1.default.OPEN) {
            this.ws.send(JSON.stringify(payload));
        }
    }
    updatePresence(presence) {
        this.send({
            op: constants_1.GatewayOpcodes.PRESENCE_UPDATE,
            d: {
                since: presence.status === 'idle' ? Date.now() : null,
                activities: presence.activities ?? [],
                status: presence.status ?? 'online',
                afk: presence.afk ?? false,
            },
        });
    }
    destroy() {
        this.sessionId = null;
        this.resumeUrl = null;
        this.cleanup();
    }
}
exports.Gateway = Gateway;
//# sourceMappingURL=Gateway.js.map