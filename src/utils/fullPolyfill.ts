/**
 * Full polyfill implementation for React Native to handle all Node.js modules
 * that Supabase and its dependencies might try to import
 */

// Buffer polyfill
import { Buffer } from 'buffer';
(global as any).Buffer = (global as any).Buffer || Buffer;

// Process polyfill
import process from 'process/browser';
(global as any).process = (global as any).process || process;

// URL polyfill
import { URL } from 'url';
(global as any).URL = (global as any).URL || URL;

// TextEncoder/TextDecoder polyfill
import { TextEncoder, TextDecoder } from 'text-encoding';
(global as any).TextEncoder = (global as any).TextEncoder || TextEncoder;
(global as any).TextDecoder = (global as any).TextDecoder || TextDecoder;

// ReadableStream polyfill (optional but useful)
// Use compatible import path
import { ReadableStream } from 'web-streams-polyfill/dist/ponyfill.js';
if (typeof (global as any).ReadableStream === 'undefined') {
    (global as any).ReadableStream = ReadableStream;
}

// Assert polyfill
import assert from 'assert';
(global as any).assert = (global as any).assert || assert;

// Set navigator.product for various libraries that check for it
if (typeof navigator !== 'undefined' && typeof (navigator as any).product === 'undefined') {
    (navigator as any).product = 'ReactNative';
}

// WebSocket implementation
// React Native already provides a WebSocket implementation, but we need to make sure it's available
(global as any).WebSocket = (global as any).WebSocket || require('react-native-websocket').default;

// Node.js built-in modules that Supabase dependencies try to use
// Mock the minimum functionality needed for these modules

// zlib module (used by ws)
(global as any).zlib = (global as any).zlib || {
    // Mock the minimum required zlib functions
    createInflateRaw: () => ({
        write: () => { },
        flush: () => { },
        close: () => { },
    }),
    createDeflateRaw: () => ({
        write: () => { },
        flush: () => { },
        close: () => { },
    }),
    // Constants
    Z_DEFAULT_COMPRESSION: -1,
    Z_DEFAULT_STRATEGY: 0,
    Z_DEFAULT_WINDOWBITS: 15,
    Z_NO_FLUSH: 0,
    Z_PARTIAL_FLUSH: 1,
    Z_SYNC_FLUSH: 2,
    Z_FULL_FLUSH: 3,
    Z_FINISH: 4,
};

// tls module (used by ws for secure connections)
(global as any).tls = (global as any).tls || {
    connect: () => {
        const mockSocket = {
            on: () => mockSocket,
            once: () => mockSocket,
            emit: () => { },
            end: () => { },
            destroy: () => { },
            setTimeout: () => { },
            setKeepAlive: () => { },
            setNoDelay: () => { },
        };
        return mockSocket;
    },
    createSecureContext: () => ({}),
    DEFAULT_MIN_VERSION: 'TLSv1.2',
    DEFAULT_MAX_VERSION: 'TLSv1.3',
    ALERT_DESCRIPTION_PROTOCOL_VERSION: 70,
};

// net module (used by ws for connections)
if (!(global as any).net) {
    try {
        (global as any).net = require('react-native-tcp');
    } catch (e) {
        (global as any).net = {
            Socket: function MockSocket() {
                return {
                    on: () => { },
                    once: () => { },
                    connect: () => { },
                    end: () => { },
                    destroy: () => { },
                };
            },
            connect: () => ({}),
            createConnection: () => ({}),
        };
    }
}

// http and https modules (used by various libraries)
if (!(global as any).http) {
    try {
        (global as any).http = require('stream-http');
    } catch (e) {
        (global as any).http = { get: () => ({}) };
    }
}

if (!(global as any).https) {
    try {
        (global as any).https = require('https-browserify');
    } catch (e) {
        (global as any).https = { get: () => ({}) };
    }
}

// crypto module
if (!(global as any).crypto) {
    try {
        (global as any).crypto = require('crypto-browserify');
    } catch (e) {
        // Simple mock if crypto-browserify is not available
        (global as any).crypto = {
            getRandomValues: (arr: Uint8Array) => {
                for (let i = 0; i < arr.length; i++) {
                    arr[i] = Math.floor(Math.random() * 256);
                }
                return arr;
            },
        };
    }
}

// Disable permessage-deflate in ws to avoid zlib issues
// This can be useful if the zlib mock doesn't properly handle all cases
(global as any).WSPermessageDeflateDisabled = true;

export default {}; 