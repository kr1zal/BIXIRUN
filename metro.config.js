const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Необходимые полифилы для Supabase и WebSocket
config.resolver.extraNodeModules = {
    crypto: require.resolve('crypto-browserify'),
    buffer: require.resolve('buffer'),
    stream: require.resolve('readable-stream'),
    url: require.resolve('url/'),
    process: require.resolve('process/browser'),
    // Добавляем обратно для WebSocket
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    net: require.resolve('react-native-tcp'),
    tls: require.resolve('react-native-tcp'),
    // Для WebSocket сжатия (permessage-deflate)
    zlib: require.resolve('browserify-zlib'),
};

module.exports = config; 