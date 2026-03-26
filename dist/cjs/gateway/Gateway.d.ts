import { EventEmitter } from 'events';
import type { PresenceData } from '../types/raw';
export interface GatewayOptions {
    intents: number;
    presence?: PresenceData;
}
export declare class Gateway extends EventEmitter {
    private ws;
    private token;
    private options;
    private heartbeatInterval;
    private sequence;
    private sessionId;
    private resumeUrl;
    private lastHeartbeatAck;
    private reconnecting;
    constructor(token: string, options: GatewayOptions);
    private readonly fatalCodes;
    connect(): void;
    private handlePayload;
    private handleEvent;
    private identify;
    private resume;
    private startHeartbeat;
    private sendHeartbeat;
    private reconnect;
    private cleanup;
    private shouldResume;
    send(payload: unknown): void;
    updatePresence(presence: PresenceData): void;
    destroy(): void;
}
//# sourceMappingURL=Gateway.d.ts.map