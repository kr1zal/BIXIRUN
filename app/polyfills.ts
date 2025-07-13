import { Buffer } from 'buffer';
// Import the enhanced WebSocket polyfill with zlib support
// import './utils/wsPolyfill';

// Polyfill ReadableStream
if (typeof globalThis.ReadableStream === 'undefined') {
    // @ts-ignore
    globalThis.ReadableStream = ReadableStream;
}

// Только необходимые полифилы для Supabase
if (typeof globalThis.Buffer === 'undefined') {
    globalThis.Buffer = Buffer;
}

// Polyfill для process
if (typeof globalThis.process === 'undefined') {
    globalThis.process = require('process/browser');
}

// TextEncoder/TextDecoder для Supabase
if (typeof globalThis.TextDecoder === 'undefined') {
    globalThis.TextDecoder = require('text-encoding').TextDecoder;
}

if (typeof globalThis.TextEncoder === 'undefined') {
    globalThis.TextEncoder = require('text-encoding').TextEncoder;
}

// URL polyfill для React Native
if (typeof globalThis.URL === 'undefined') {
    globalThis.URL = require('url').URL;
}

// zlib полифил для WebSocket сжатия
if (typeof (globalThis as any).zlib === 'undefined') {
    (globalThis as any).zlib = require('browserify-zlib');
}

// Добавляем navigator.product для определения платформы
if (typeof navigator !== 'undefined' && typeof navigator.product === 'undefined') {
    // @ts-ignore
    navigator.product = 'ReactNative';
}

// Заглушка для отсутствующих API
const noop = () => { };

// WebSocket полифилы для корректной работы
if (typeof globalThis.WebSocket === 'undefined') {
    // Используем React Native WebSocket
    globalThis.WebSocket = require('react-native').WebSocket;
}

// Дополнительные полифилы для HTTP модулей (нужны для ws библиотеки)
if (typeof globalThis.XMLHttpRequest === 'undefined') {
    globalThis.XMLHttpRequest = require('react-native').XMLHttpRequest || (() => { });
}

// Add other required polyfills here if needed 

// Полифилы для Node.js модулей (необходимы для ws библиотеки)
// Эти модули будут заменены Metro resolver'ом на browserify версии
if (typeof require !== 'undefined') {
    // Убеждаемся что полифилы доступны глобально
    globalThis.global = globalThis.global || globalThis;
} 