const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Минимизируем node-полифилы. Оставляем только действительно необходимые
config.resolver.extraNodeModules = {
    buffer: require.resolve('buffer'),
    process: require.resolve('process/browser'),
};

module.exports = config;