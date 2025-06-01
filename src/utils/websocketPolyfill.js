// WebSocket Polyfill для React Native
// Импортировать этот файл до инициализации Supabase

// Используем встроенный WebSocket от React Native
global.WebSocket = global.WebSocket || require('react-native-websocket').default;

// Настройка для предотвращения ошибок с отсутствующими Node модулями
if (typeof global.process === 'undefined') {
    global.process = require('process/browser');
}

if (typeof global.Buffer === 'undefined') {
    global.Buffer = require('buffer').Buffer;
}

// Заглушка для navigator.product
if (typeof navigator !== 'undefined' && typeof navigator.product === 'undefined') {
    navigator.product = 'ReactNative';
}

export default {}; 