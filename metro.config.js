const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');

// Polyfill Node.js modules not available in React Native
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Return custom polyfill for async_hooks
  if (moduleName === 'node:async_hooks' || moduleName === 'async_hooks') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'polyfills/async_hooks.js'),
    };
  }

  // Return empty for other Node.js-specific modules that aren't needed
  const emptyModules = [
    'node:buffer',
    'node:stream',
    'node:url',
    'node:path',
    'node:fs',
    'node:net',
    'node:crypto',
    'node:os',
    'node:util',
    'node:events',
  ];

  for (const emptyModule of emptyModules) {
    if (moduleName === emptyModule || moduleName.startsWith(emptyModule + '/')) {
      return { type: 'empty' };
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });