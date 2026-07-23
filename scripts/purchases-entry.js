// Bundled (via esbuild) into vendor/purchases-bundle.js — the only part of
// this app that uses a build step, because the RevenueCat Capacitor plugin's
// own JS glue code needs its bare `@capacitor/core` import resolved somehow.
// Bundling @capacitor/core's real source in (rather than treating it as
// external) is safe: its actual implementation does `win.Capacitor || {}`,
// so at runtime it detects and reuses the native-injected window.Capacitor
// instead of creating a disconnected instance — confirmed by reading
// node_modules/@capacitor/core/dist/index.js directly before relying on it.
import { Purchases } from '@revenuecat/purchases-capacitor';
window.ItikafPurchases = Purchases;
