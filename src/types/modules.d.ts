// Type declarations for modules without typings

declare module 'process/browser';
declare module 'text-encoding';
declare module 'web-streams-polyfill/ponyfill';
declare module 'web-streams-polyfill/dist/ponyfill.js';
declare module 'react-native-websocket';
declare module 'react-native-tcp';
declare module 'stream-http';
declare module 'https-browserify';
declare module 'browserify-zlib';
declare module 'url';
declare module 'assert';

// Fix "has no index signature" errors
interface CustomGlobal extends NodeJS.Global {
    zlib: any;
    WebSocket: any;
    tls: any;
    net: any;
    http: any;
    https: any;
    assert: any;
    ReadableStream: any;
    WSPermessageDeflateDisabled: boolean;
}

declare global {
    // This merges our CustomGlobal with the global namespace
    type Global = CustomGlobal;
    var zlib: any;
    var tls: any;
    var net: any;
    var http: any;
    var https: any;
    var assert: any;
    var WSPermessageDeflateDisabled: boolean;
} 