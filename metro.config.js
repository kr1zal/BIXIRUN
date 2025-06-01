const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Добавляем полифилы для Node.js модулей
config.resolver.extraNodeModules = {
    url: require.resolve('url/'),
    fs: require.resolve('expo-file-system'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    net: require.resolve('react-native-tcp'),
    path: require.resolve('path-browserify'),
    stream: require.resolve('readable-stream'),
    zlib: require.resolve('browserify-zlib'),
    crypto: require.resolve('crypto-browserify'),
    buffer: require.resolve('buffer'),
    tls: require.resolve('react-native-tcp'), // Use react-native-tcp as a TLS polyfill
    assert: require.resolve('assert/'), // Add assert polyfill
};

module.exports = config; 