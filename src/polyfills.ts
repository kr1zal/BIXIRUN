import { ReadableStream } from 'web-streams-polyfill/dist/ponyfill.js';
import { Buffer } from 'buffer';

// Import the enhanced WebSocket polyfill with zlib support
import './utils/wsPolyfill';

// Polyfill ReadableStream
if (typeof globalThis.ReadableStream === 'undefined') {
    // @ts-ignore
    globalThis.ReadableStream = ReadableStream;
}

// Polyfill для Buffer
if (typeof globalThis.Buffer === 'undefined') {
    // @ts-ignore
    globalThis.Buffer = Buffer;
}

// Polyfill для process
if (typeof globalThis.process === 'undefined') {
    // @ts-ignore
    globalThis.process = require('process/browser');
}

// Fix URL constructor
if (typeof globalThis.URL === 'undefined') {
    // @ts-ignore
    globalThis.URL = require('url').URL;
}

// Explicit zlib mock (additional backup)
if (typeof (globalThis as any).zlib === 'undefined') {
    // @ts-ignore
    (globalThis as any).zlib = require('browserify-zlib');
}

// Добавляем navigator.product для определения платформы
if (typeof navigator !== 'undefined' && typeof navigator.product === 'undefined') {
    // @ts-ignore
    navigator.product = 'ReactNative';
}

// Заглушка для отсутствующих API
const noop = () => { };
globalThis.TextDecoder = globalThis.TextDecoder || require('text-encoding').TextDecoder;
globalThis.TextEncoder = globalThis.TextEncoder || require('text-encoding').TextEncoder;

// Add other required polyfills here if needed 