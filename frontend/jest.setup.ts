import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'node:util';

// Mock environment config (Vite import.meta.env replacement)
jest.mock(
    '@shared/config/environment.config',
    () => ({
        ENV: {
            API_BASE_URL: 'http://localhost:3000',
            DATA_ENRICHMENT_SERVICE_URL: 'http://localhost:3000/api',
            APP_TITLE: 'Tazama Connection Studio',
            APP_ENV: 'test',
            IS_DEVELOPMENT: false,
            IS_PRODUCTION: false,
        },
    }),
    { virtual: true },
);

process.env.NODE_ENV = 'test';

// Provide TextEncoder/TextDecoder for environments that lack them
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof (global as any).TextEncoder === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { TextEncoder, TextDecoder } = require('util');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).TextEncoder = TextEncoder;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).TextDecoder = TextDecoder;
}

// Minimal ResizeObserver mock
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof (global as any).ResizeObserver === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).ResizeObserver = class {
        observe() { }
        unobserve() { }
        disconnect() { }
    };
}

// Ensure global fetch exists for tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof (global as any).fetch === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { jest } = require('@jest/globals');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = jest.fn(() =>
        Promise.resolve({ ok: true, status: 200, json: async () => ({}) }),
    );
}

// Default fetch mock — tests can override per-case
global.fetch = (global.fetch as any) || (async () => ({ ok: true, status: 200 })) as any;

// In-memory localStorage mock implementation
const createLocalStorageMock = () => {
    let store: Record<string, string> = {};
    return {
        getItem(key: string) {
            return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
        },
        setItem(key: string, value: string) {
            store[key] = String(value);
        },
        removeItem(key: string) {
            delete store[key];
        },
        clear() {
            store = {};
        },
        key(i: number) {
            return Object.keys(store)[i] ?? null;
        },
        get length() {
            return Object.keys(store).length;
        },
    } as Storage;
};

Object.defineProperty(global, 'localStorage', {
    value: createLocalStorageMock(),
    writable: true,
});
// Ensure window.localStorage references the same mock (some code uses window.localStorage)
Object.defineProperty(window, 'localStorage', {
    value: (global as any).localStorage,
    writable: true,
});

// matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
    }),
});

// IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    unobserve() { }
    takeRecords(): IntersectionObserverEntry[] {
        return [];
    }
} as unknown as typeof global.IntersectionObserver;

Element.prototype.scrollIntoView = function () { };

if (!HTMLElement.prototype.scrollTo) {
    HTMLElement.prototype.scrollTo = function () { };
}

// Mock jwt-decode to return a predictable payload based on token patterns
jest.mock(
    'jwt-decode',
    () => {
        return (token: string) => {
            if (!token) return null;
            try {
                const parts = token.split('.');
                if (parts.length >= 2) {
                    // Normalize URL-safe base64 to standard base64
                    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                    const pad = b64.length % 4;
                    if (pad === 2) b64 += '==';
                    else if (pad === 3) b64 += '=';
                    else if (pad === 1) b64 += '===';
                    const payload = Buffer.from(b64, 'base64').toString('utf8');
                    return JSON.parse(payload);
                }
            } catch (e) {
                // fallthrough
            }
            return null;
        };
    },
    { virtual: true },
);

afterEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset?.();
});

// Default Vite-like env for tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).__VITE_ENV__ = {
    VITE_API_BASE_URL: 'http://localhost:3011',
    VITE_APP_TITLE: 'Tazama Config Studio',
    VITE_APP_ENV: 'test',
    VITE_ALLOWED_HOSTS: 'all',
};
