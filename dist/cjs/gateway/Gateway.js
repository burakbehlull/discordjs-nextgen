"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gateway = void 0;
const ws_1 = __importDefault(require("ws"));
const events_1 = require("events");
const constants_js_1 = require("../types/constants.js");
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
        const url = this.resumeUrl ?? constants_js_1.GATEWAY_URL;
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
            case constants_js_1.GatewayOpcodes.HELLO: {
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
            case constants_js_1.GatewayOpcodes.HEARTBEAT_ACK:
                this.lastHeartbeatAck = true;
                break;
            case constants_js_1.GatewayOpcodes.HEARTBEAT:
                this.sendHeartbeat();
                break;
            case constants_js_1.GatewayOpcodes.RECONNECT:
                this.reconnect();
                break;
            case constants_js_1.GatewayOpcodes.INVALID_SESSION: {
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
            case constants_js_1.GatewayOpcodes.DISPATCH:
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
        this.send(constants_js_1.GatewayOpcodes.IDENTIFY, {
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
        this.send(constants_js_1.GatewayOpcodes.RESUME, {
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
        this.send(constants_js_1.GatewayOpcodes.HEARTBEAT, this.sequence);
    }
    reconnect() {
        if (this.reconnecting)
            return;
        this.reconnecting = true;
        this.destroy();
        this.connect();
    }
    send(op, d) {
        if (this.ws?.readyState === ws_1.default.OPEN) {
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
        this.send(constants_js_1.GatewayOpcodes.PRESENCE_UPDATE, presence);
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
exports.Gateway = Gateway;
//# sourceMappingURL=Gateway.js.map