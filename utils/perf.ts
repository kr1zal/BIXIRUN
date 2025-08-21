/* Simple navigation performance tracer for DEV builds. */

type NavStart = {
    toPath: string;
    fromPath?: string;
    startedAtMs: number;
};

let currentNav: NavStart | null = null;
let _lastMeasuredPath: string | null = null;
let layoutMeasuredForPath: string | null = null;

const now = () => Date.now();

export const Perf = {
    markNavStart(toPath: string, fromPath?: string) {
        if (!__DEV__) return;
        currentNav = { toPath, fromPath, startedAtMs: now() };
        // eslint-disable-next-line no-console
        console.log('⏱️ [NAV] start →', toPath, fromPath ? `(from ${fromPath})` : '');
    },

    markPathFocus(path: string) {
        if (!__DEV__) return;
        _lastMeasuredPath = path;
        if (currentNav && currentNav.toPath === path) {
            const dt = now() - currentNav.startedAtMs;
            // eslint-disable-next-line no-console
            console.log('✅ [NAV] focused →', path, `(${dt} ms since tap)`);
        } else {
            // eslint-disable-next-line no-console
            console.log('ℹ️ [NAV] focused (no start) →', path);
        }
    },

    markFirstLayout(path: string) {
        if (!__DEV__) return;
        if (layoutMeasuredForPath === path) return; // only once per path
        layoutMeasuredForPath = path;
        if (currentNav && currentNav.toPath === path) {
            const dt = now() - currentNav.startedAtMs;
            // eslint-disable-next-line no-console
            console.log('🖼️ [NAV] firstLayout →', path, `(${dt} ms since tap)`);
        } else {
            // eslint-disable-next-line no-console
            console.log('🖼️ [NAV] firstLayout (no start) →', path);
        }
    },

    resetIfDone(path: string) {
        if (!__DEV__) return;
        if (currentNav && currentNav.toPath === path) {
            currentNav = null;
        }
    }
};


