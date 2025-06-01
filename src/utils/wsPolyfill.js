// Advanced WebSocket Polyfill for React Native with zlib and tls support
// This polyfill specifically handles the permessage-deflate in ws package

// First, ensure global.WebSocket is available
global.WebSocket = global.WebSocket || require('react-native-websocket').default;

// Set up required Node.js modules that ws package tries to use
if (typeof global.process === 'undefined') {
    global.process = require('process/browser');
}

// Critical: Mock the zlib module that ws/permessage-deflate tries to use
// This prevents the "attempted to import Node standard library module zlib" error
global.zlib = global.zlib || {
    // Mock the minimum required zlib functions that ws uses
    createInflateRaw: () => {
        return {
            write: () => { },
            flush: () => { },
            close: () => { }
        };
    },
    createDeflateRaw: () => {
        return {
            write: () => { },
            flush: () => { },
            close: () => { }
        };
    },
    // Add constants that ws might check
    Z_DEFAULT_COMPRESSION: -1,
    Z_DEFAULT_STRATEGY: 0,
    Z_DEFAULT_WINDOWBITS: 15,
    Z_NO_FLUSH: 0,
    Z_PARTIAL_FLUSH: 1,
    Z_SYNC_FLUSH: 2,
    Z_FULL_FLUSH: 3,
    Z_FINISH: 4
};

// Mock the tls module
global.tls = global.tls || {
    connect: () => {
        const mockSocket = {
            on: () => mockSocket,
            once: () => mockSocket,
            emit: () => { },
            end: () => { },
            destroy: () => { },
            setTimeout: () => { },
            setKeepAlive: () => { },
            setNoDelay: () => { }
        };
        return mockSocket;
    },
    createSecureContext: () => ({}),
    // TLS protocol versions
    DEFAULT_MIN_VERSION: 'TLSv1.2',
    DEFAULT_MAX_VERSION: 'TLSv1.3',
    // TLS constants
    ALERT_DESCRIPTION_PROTOCOL_VERSION: 70
};

// Add other requirements
if (typeof global.Buffer === 'undefined') {
    global.Buffer = require('buffer').Buffer;
}

// Ensure navigator.product is set
if (typeof navigator !== 'undefined' && typeof navigator.product === 'undefined') {
    navigator.product = 'ReactNative';
}

export default {}; 