export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export interface RequestOptions {
    method?: HTTPMethod;
    body?: Record<string, unknown> | unknown[];
    reason?: string;
}
export declare class RESTClient {
    private token;
    private rateLimits;
    constructor(token: string);
    setToken(token: string): void;
    request<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T>;
    get<T = unknown>(endpoint: string): Promise<T>;
    post<T = unknown>(endpoint: string, body?: Record<string, unknown>): Promise<T>;
    patch<T = unknown>(endpoint: string, body?: Record<string, unknown>, reason?: string): Promise<T>;
    put<T = unknown>(endpoint: string, body?: Record<string, unknown>): Promise<T>;
    delete<T = unknown>(endpoint: string, reason?: string): Promise<T>;
}
//# sourceMappingURL=RESTClient.d.ts.map