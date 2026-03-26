import * as https from 'https';
import { API_BASE } from '../types/constants.js';
export class RESTClient {
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
            const url = new URL(API_BASE + endpoint);
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
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }
    async post(endpoint, body) {
        return this.request(endpoint, { method: 'POST', body });
    }
    async patch(endpoint, body, reason) {
        return this.request(endpoint, { method: 'PATCH', body, reason });
    }
    async delete(endpoint, reason) {
        return this.request(endpoint, { method: 'DELETE', reason });
    }
}
//# sourceMappingURL=RESTClient.js.map