const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// This app lives in a monorepo (apps/customer-app) alongside unrelated apps
// (apps/marketing, apps/api, apps/vendor-dashboard, apps/admin-panel,
// apps/delivery-app). Metro's default file watcher walks up to the workspace
// root and watches everything under it, including those siblings' node_modules
// — which crashed the dev server (ENOENT on a file that vanished mid-watch)
// when apps/marketing was actively being built in another terminal. None of
// those directories are ever imported from customer-app, so excluding them
// from the crawl entirely avoids both the crash and the wasted watch overhead.
// resolver.blockList is a plain array of RegExp (not a single combined one in
// this Metro version) — append to whatever Expo's default config already set.
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : [config.resolver.blockList]),
  /apps[\\/]marketing[\\/].*/,
  /apps[\\/]api[\\/].*/,
  /apps[\\/]vendor-dashboard[\\/].*/,
  /apps[\\/]admin-panel[\\/].*/,
  /apps[\\/]delivery-app[\\/].*/,
];

module.exports = config;
