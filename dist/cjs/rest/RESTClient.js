"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESTClient = void 0;
const https = __importStar(require("https"));
const constants_1 = require("../types/constants");
class RESTClient {
    constructor(token) {
        this.rateLimits = new Map();
        this.token = token;
    }
    setToken(token) {
        this.token = token;
    }
    async request(endpoint, options = {}) {
        const { method = 'GET', body, reason } = options;
        const routeKey = `${method}:${endpoint}`;
        const rateLimit = this.rateLimits.get(routeKey);
        if (rateLimit && rateLimit.remaining === 0 && Date.now() < rateLimit.reset) {
            const waitMs = rateLimit.reset - Date.now();
            await new Promise((r) => setTimeout(r, waitMs));
        }
        return new Promise((resolve, reject) => {
            const url = new URL(constants_1.API_BASE + endpoint);
            const bodyStr = body ? JSON.stringify(body) : undefined;
            const headers = {
                Authorization: `Bot ${this.token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'HarmoniaBot/0.1.0',
            };
            if (reason) {
                headers['X-Audit-Log-Reason'] = encodeURIComponent(reason);
            }
            if (bodyStr) {
                headers['Content-Length'] = Buffer.byteLength(bodyStr).toString();
            }
            const req = https.request({
                hostname: url.hostname,
                path: url.pathname + url.search,
                method,
                headers,
            }, (res) => {
                const remaining = res.headers['x-ratelimit-remaining'];
                const reset = res.headers['x-ratelimit-reset-after'];
                if (remaining !== undefined && reset !== undefined) {
                    this.rateLimits.set(routeKey, {
                        remaining: Number(remaining),
                        reset: Date.now() + Number(reset) * 1000,
                    });
                }
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    if (res.statusCode === 204) {
                        resolve(undefined);
                        return;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        if (res.statusCode && res.statusCode >= 400) {
                            const err = new Error(`Discord API Error ${res.statusCode}: ${parsed.message ?? data}`);
                            err.code = parsed.code;
                            err.status = res.statusCode;
                            reject(err);
                            return;
                        }
                        resolve(parsed);
                    }
                    catch {
                        reject(new Error(`Failed to parse response: ${data}`));
                    }
                });
            });
            req.on('error', reject);
            if (bodyStr)
                req.write(bodyStr);
            req.end();
        });
    }
    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }
    post(endpoint, body) {
        return this.request(endpoint, { method: 'POST', body });
    }
    patch(endpoint, body, reason) {
        return this.request(endpoint, { method: 'PATCH', body, reason });
    }
    put(endpoint, body) {
        return this.request(endpoint, { method: 'PUT', body });
    }
    delete(endpoint, reason) {
        return this.request(endpoint, { method: 'DELETE', reason });
    }
}
exports.RESTClient = RESTClient;
//# sourceMappingURL=RESTClient.js.map