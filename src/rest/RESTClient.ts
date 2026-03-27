import * as https from 'https';
import { API_BASE } from '../types/constants.js';

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: HTTPMethod;
  body?: Record<string, unknown> | unknown[];
  reason?: string;
}

export class RESTClient {
  private token: string;
  private rateLimits: Map<string, { reset: number; remaining: number }> = new Map();

  constructor(token: string) {
    this.token = token;
  }

  setToken(token: string): void {
    this.token = token;
  }

  async request<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
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

      const headers: Record<string, string> = {
        Authorization: `Bot ${this.token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'discordjs-nextgen/1.2.0',
      };

      if (reason) {
        headers['X-Audit-Log-Reason'] = encodeURIComponent(reason);
      }

      if (bodyStr) {
        headers['Content-Length'] = Buffer.byteLength(bodyStr).toString();
      }

      const req = https.request(
        {
          hostname: url.hostname,
          path: url.pathname + url.search,
          method,
          headers,
        },
        (res) => {
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
              resolve(undefined as T);
              return;
            }

            try {
              const parsed = data ? JSON.parse(data) : {};
              if (res.statusCode === 429) {
                const bodyRetry = parsed.retry_after ? Number(parsed.retry_after) : undefined;
                const headerRetry = res.headers['retry-after'] ? Number(res.headers['retry-after']) : undefined;
                const retryAfter = (bodyRetry ?? headerRetry ?? 1) * 1000;
                
                setTimeout(() => {
                  this.request<T>(endpoint, options).then(resolve).catch(reject);
                }, retryAfter);
                return;
              }
              if (res.statusCode && res.statusCode >= 400) {
                const err = new Error(
                  `Discord API Error ${res.statusCode}: ${parsed.message ?? data}`
                ) as Error & { code?: number; status?: number };
                err.code = parsed.code;
                err.status = res.statusCode;
                reject(err);
                return;
              }
              resolve(parsed as T);
            } catch {
              reject(new Error(`Failed to parse response: ${data}`));
            }
          });
        }
      );

      req.on('error', reject);
      if (bodyStr) req.write(bodyStr);
      req.end();
    });
  }

  async get<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, body?: Record<string, unknown> | unknown[]): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  async patch<T = unknown>(
    endpoint: string,
    body?: Record<string, unknown> | unknown[],
    reason?: string
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body, reason });
  }

  async delete<T = unknown>(endpoint: string, reason?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', reason });
  }
}
