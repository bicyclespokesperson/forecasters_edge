// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

(function (
  modules,
  entry,
  mainEntry,
  parcelRequireName,
  externals,
  distDir,
  publicUrl,
  devServer
) {
  /* eslint-disable no-undef */
  var globalObject =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof self !== 'undefined'
      ? self
      : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
      ? global
      : {};
  /* eslint-enable no-undef */

  // Save the require from previous bundle to this closure if any
  var previousRequire =
    typeof globalObject[parcelRequireName] === 'function' &&
    globalObject[parcelRequireName];

  var importMap = previousRequire.i || {};
  var cache = previousRequire.cache || {};
  // Do not use `require` to prevent Webpack from trying to bundle this call
  var nodeRequire =
    typeof module !== 'undefined' &&
    typeof module.require === 'function' &&
    module.require.bind(module);

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        if (externals[name]) {
          return externals[name];
        }
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire =
          typeof globalObject[parcelRequireName] === 'function' &&
          globalObject[parcelRequireName];
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = (cache[name] = new newRequire.Module(name));

      modules[name][0].call(
        module.exports,
        localRequire,
        module,
        module.exports,
        globalObject
      );
    }

    return cache[name].exports;

    function localRequire(x) {
      var res = localRequire.resolve(x);
      return res === false ? {} : newRequire(res);
    }

    function resolve(x) {
      var id = modules[name][1][x];
      return id != null ? id : x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.require = nodeRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.distDir = distDir;
  newRequire.publicUrl = publicUrl;
  newRequire.devServer = devServer;
  newRequire.i = importMap;
  newRequire.register = function (id, exports) {
    modules[id] = [
      function (require, module) {
        module.exports = exports;
      },
      {},
    ];
  };

  // Only insert newRequire.load when it is actually used.
  // The code in this file is linted against ES5, so dynamic import is not allowed.
  // INSERT_LOAD_HERE

  Object.defineProperty(newRequire, 'root', {
    get: function () {
      return globalObject[parcelRequireName];
    },
  });

  globalObject[parcelRequireName] = newRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (mainEntry) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(mainEntry);

    // CommonJS
    if (typeof exports === 'object' && typeof module !== 'undefined') {
      module.exports = mainExports;

      // RequireJS
    } else if (typeof define === 'function' && define.amd) {
      define(function () {
        return mainExports;
      });
    }
  }
})({"kZ8pU":[function(require,module,exports,__globalThis) {
var global = arguments[3];
var HMR_HOST = null;
var HMR_PORT = null;
var HMR_SERVER_PORT = 1234;
var HMR_SECURE = false;
var HMR_ENV_HASH = "439701173a9199ea";
var HMR_USE_SSE = false;
module.bundle.HMR_BUNDLE_ID = "f36f7065fb736eb8";
"use strict";
/* global HMR_HOST, HMR_PORT, HMR_SERVER_PORT, HMR_ENV_HASH, HMR_SECURE, HMR_USE_SSE, chrome, browser, __parcel__import__, __parcel__importScripts__, ServiceWorkerGlobalScope */ /*::
import type {
  HMRAsset,
  HMRMessage,
} from '@parcel/reporter-dev-server/src/HMRServer.js';
interface ParcelRequire {
  (string): mixed;
  cache: {|[string]: ParcelModule|};
  hotData: {|[string]: mixed|};
  Module: any;
  parent: ?ParcelRequire;
  isParcelRequire: true;
  modules: {|[string]: [Function, {|[string]: string|}]|};
  HMR_BUNDLE_ID: string;
  root: ParcelRequire;
}
interface ParcelModule {
  hot: {|
    data: mixed,
    accept(cb: (Function) => void): void,
    dispose(cb: (mixed) => void): void,
    // accept(deps: Array<string> | string, cb: (Function) => void): void,
    // decline(): void,
    _acceptCallbacks: Array<(Function) => void>,
    _disposeCallbacks: Array<(mixed) => void>,
  |};
}
interface ExtensionContext {
  runtime: {|
    reload(): void,
    getURL(url: string): string;
    getManifest(): {manifest_version: number, ...};
  |};
}
declare var module: {bundle: ParcelRequire, ...};
declare var HMR_HOST: string;
declare var HMR_PORT: string;
declare var HMR_SERVER_PORT: string;
declare var HMR_ENV_HASH: string;
declare var HMR_SECURE: boolean;
declare var HMR_USE_SSE: boolean;
declare var chrome: ExtensionContext;
declare var browser: ExtensionContext;
declare var __parcel__import__: (string) => Promise<void>;
declare var __parcel__importScripts__: (string) => Promise<void>;
declare var globalThis: typeof self;
declare var ServiceWorkerGlobalScope: Object;
*/ var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;
function Module(moduleName) {
    OldModule.call(this, moduleName);
    this.hot = {
        data: module.bundle.hotData[moduleName],
        _acceptCallbacks: [],
        _disposeCallbacks: [],
        accept: function(fn) {
            this._acceptCallbacks.push(fn || function() {});
        },
        dispose: function(fn) {
            this._disposeCallbacks.push(fn);
        }
    };
    module.bundle.hotData[moduleName] = undefined;
}
module.bundle.Module = Module;
module.bundle.hotData = {};
var checkedAssets /*: {|[string]: boolean|} */ , disposedAssets /*: {|[string]: boolean|} */ , assetsToDispose /*: Array<[ParcelRequire, string]> */ , assetsToAccept /*: Array<[ParcelRequire, string]> */ , bundleNotFound = false;
function getHostname() {
    return HMR_HOST || (typeof location !== 'undefined' && location.protocol.indexOf('http') === 0 ? location.hostname : 'localhost');
}
function getPort() {
    return HMR_PORT || (typeof location !== 'undefined' ? location.port : HMR_SERVER_PORT);
}
// eslint-disable-next-line no-redeclare
let WebSocket = globalThis.WebSocket;
if (!WebSocket && typeof module.bundle.root === 'function') try {
    // eslint-disable-next-line no-global-assign
    WebSocket = module.bundle.root('ws');
} catch  {
// ignore.
}
var hostname = getHostname();
var port = getPort();
var protocol = HMR_SECURE || typeof location !== 'undefined' && location.protocol === 'https:' && ![
    'localhost',
    '127.0.0.1',
    '0.0.0.0'
].includes(hostname) ? 'wss' : 'ws';
// eslint-disable-next-line no-redeclare
var parent = module.bundle.parent;
if (!parent || !parent.isParcelRequire) {
    // Web extension context
    var extCtx = typeof browser === 'undefined' ? typeof chrome === 'undefined' ? null : chrome : browser;
    // Safari doesn't support sourceURL in error stacks.
    // eval may also be disabled via CSP, so do a quick check.
    var supportsSourceURL = false;
    try {
        (0, eval)('throw new Error("test"); //# sourceURL=test.js');
    } catch (err) {
        supportsSourceURL = err.stack.includes('test.js');
    }
    var ws;
    if (HMR_USE_SSE) ws = new EventSource('/__parcel_hmr');
    else try {
        // If we're running in the dev server's node runner, listen for messages on the parent port.
        let { workerData, parentPort } = module.bundle.root('node:worker_threads') /*: any*/ ;
        if (workerData !== null && workerData !== void 0 && workerData.__parcel) {
            parentPort.on('message', async (message)=>{
                try {
                    await handleMessage(message);
                    parentPort.postMessage('updated');
                } catch  {
                    parentPort.postMessage('restart');
                }
            });
            // After the bundle has finished running, notify the dev server that the HMR update is complete.
            queueMicrotask(()=>parentPort.postMessage('ready'));
        }
    } catch  {
        if (typeof WebSocket !== 'undefined') try {
            ws = new WebSocket(protocol + '://' + hostname + (port ? ':' + port : '') + '/');
        } catch (err) {
            // Ignore cloudflare workers error.
            if (err.message && !err.message.includes('Disallowed operation called within global scope')) console.error(err.message);
        }
    }
    if (ws) {
        // $FlowFixMe
        ws.onmessage = async function(event /*: {data: string, ...} */ ) {
            var data /*: HMRMessage */  = JSON.parse(event.data);
            await handleMessage(data);
        };
        if (ws instanceof WebSocket) {
            ws.onerror = function(e) {
                if (e.message) console.error(e.message);
            };
            ws.onclose = function() {
                console.warn("[parcel] \uD83D\uDEA8 Connection to the HMR server was lost");
            };
        }
    }
}
async function handleMessage(data /*: HMRMessage */ ) {
    checkedAssets = {} /*: {|[string]: boolean|} */ ;
    disposedAssets = {} /*: {|[string]: boolean|} */ ;
    assetsToAccept = [];
    assetsToDispose = [];
    bundleNotFound = false;
    if (data.type === 'reload') fullReload();
    else if (data.type === 'update') {
        // Remove error overlay if there is one
        if (typeof document !== 'undefined') removeErrorOverlay();
        let assets = data.assets;
        // Handle HMR Update
        let handled = assets.every((asset)=>{
            return asset.type === 'css' || asset.type === 'js' && hmrAcceptCheck(module.bundle.root, asset.id, asset.depsByBundle);
        });
        // Dispatch a custom event in case a bundle was not found. This might mean
        // an asset on the server changed and we should reload the page. This event
        // gives the client an opportunity to refresh without losing state
        // (e.g. via React Server Components). If e.preventDefault() is not called,
        // we will trigger a full page reload.
        if (handled && bundleNotFound && assets.some((a)=>a.envHash !== HMR_ENV_HASH) && typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') handled = !window.dispatchEvent(new CustomEvent('parcelhmrreload', {
            cancelable: true
        }));
        if (handled) {
            console.clear();
            // Dispatch custom event so other runtimes (e.g React Refresh) are aware.
            if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') window.dispatchEvent(new CustomEvent('parcelhmraccept'));
            await hmrApplyUpdates(assets);
            hmrDisposeQueue();
            // Run accept callbacks. This will also re-execute other disposed assets in topological order.
            let processedAssets = {};
            for(let i = 0; i < assetsToAccept.length; i++){
                let id = assetsToAccept[i][1];
                if (!processedAssets[id]) {
                    hmrAccept(assetsToAccept[i][0], id);
                    processedAssets[id] = true;
                }
            }
        } else fullReload();
    }
    if (data.type === 'error') {
        // Log parcel errors to console
        for (let ansiDiagnostic of data.diagnostics.ansi){
            let stack = ansiDiagnostic.codeframe ? ansiDiagnostic.codeframe : ansiDiagnostic.stack;
            console.error("\uD83D\uDEA8 [parcel]: " + ansiDiagnostic.message + '\n' + stack + '\n\n' + ansiDiagnostic.hints.join('\n'));
        }
        if (typeof document !== 'undefined') {
            // Render the fancy html overlay
            removeErrorOverlay();
            var overlay = createErrorOverlay(data.diagnostics.html);
            // $FlowFixMe
            document.body.appendChild(overlay);
        }
    }
}
function removeErrorOverlay() {
    var overlay = document.getElementById(OVERLAY_ID);
    if (overlay) {
        overlay.remove();
        console.log("[parcel] \u2728 Error resolved");
    }
}
function createErrorOverlay(diagnostics) {
    var overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    let errorHTML = '<div style="background: black; opacity: 0.85; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; font-family: Menlo, Consolas, monospace; z-index: 9999;">';
    for (let diagnostic of diagnostics){
        let stack = diagnostic.frames.length ? diagnostic.frames.reduce((p, frame)=>{
            return `${p}
<a href="${protocol === 'wss' ? 'https' : 'http'}://${hostname}:${port}/__parcel_launch_editor?file=${encodeURIComponent(frame.location)}" style="text-decoration: underline; color: #888" onclick="fetch(this.href); return false">${frame.location}</a>
${frame.code}`;
        }, '') : diagnostic.stack;
        errorHTML += `
      <div>
        <div style="font-size: 18px; font-weight: bold; margin-top: 20px;">
          \u{1F6A8} ${diagnostic.message}
        </div>
        <pre>${stack}</pre>
        <div>
          ${diagnostic.hints.map((hint)=>"<div>\uD83D\uDCA1 " + hint + '</div>').join('')}
        </div>
        ${diagnostic.documentation ? `<div>\u{1F4DD} <a style="color: violet" href="${diagnostic.documentation}" target="_blank">Learn more</a></div>` : ''}
      </div>
    `;
    }
    errorHTML += '</div>';
    overlay.innerHTML = errorHTML;
    return overlay;
}
function fullReload() {
    if (typeof location !== 'undefined' && 'reload' in location) location.reload();
    else if (typeof extCtx !== 'undefined' && extCtx && extCtx.runtime && extCtx.runtime.reload) extCtx.runtime.reload();
    else try {
        let { workerData, parentPort } = module.bundle.root('node:worker_threads') /*: any*/ ;
        if (workerData !== null && workerData !== void 0 && workerData.__parcel) parentPort.postMessage('restart');
    } catch (err) {
        console.error("[parcel] \u26A0\uFE0F An HMR update was not accepted. Please restart the process.");
    }
}
function getParents(bundle, id) /*: Array<[ParcelRequire, string]> */ {
    var modules = bundle.modules;
    if (!modules) return [];
    var parents = [];
    var k, d, dep;
    for(k in modules)for(d in modules[k][1]){
        dep = modules[k][1][d];
        if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) parents.push([
            bundle,
            k
        ]);
    }
    if (bundle.parent) parents = parents.concat(getParents(bundle.parent, id));
    return parents;
}
function updateLink(link) {
    var href = link.getAttribute('href');
    if (!href) return;
    var newLink = link.cloneNode();
    newLink.onload = function() {
        if (link.parentNode !== null) // $FlowFixMe
        link.parentNode.removeChild(link);
    };
    newLink.setAttribute('href', // $FlowFixMe
    href.split('?')[0] + '?' + Date.now());
    // $FlowFixMe
    link.parentNode.insertBefore(newLink, link.nextSibling);
}
var cssTimeout = null;
function reloadCSS() {
    if (cssTimeout || typeof document === 'undefined') return;
    cssTimeout = setTimeout(function() {
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        for(var i = 0; i < links.length; i++){
            // $FlowFixMe[incompatible-type]
            var href /*: string */  = links[i].getAttribute('href');
            var hostname = getHostname();
            var servedFromHMRServer = hostname === 'localhost' ? new RegExp('^(https?:\\/\\/(0.0.0.0|127.0.0.1)|localhost):' + getPort()).test(href) : href.indexOf(hostname + ':' + getPort());
            var absolute = /^https?:\/\//i.test(href) && href.indexOf(location.origin) !== 0 && !servedFromHMRServer;
            if (!absolute) updateLink(links[i]);
        }
        cssTimeout = null;
    }, 50);
}
function hmrDownload(asset) {
    if (asset.type === 'js') {
        if (typeof document !== 'undefined') {
            let script = document.createElement('script');
            script.src = asset.url + '?t=' + Date.now();
            if (asset.outputFormat === 'esmodule') script.type = 'module';
            return new Promise((resolve, reject)=>{
                var _document$head;
                script.onload = ()=>resolve(script);
                script.onerror = reject;
                (_document$head = document.head) === null || _document$head === void 0 || _document$head.appendChild(script);
            });
        } else if (typeof importScripts === 'function') {
            // Worker scripts
            if (asset.outputFormat === 'esmodule') return import(asset.url + '?t=' + Date.now());
            else return new Promise((resolve, reject)=>{
                try {
                    importScripts(asset.url + '?t=' + Date.now());
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        }
    }
}
async function hmrApplyUpdates(assets) {
    global.parcelHotUpdate = Object.create(null);
    let scriptsToRemove;
    try {
        // If sourceURL comments aren't supported in eval, we need to load
        // the update from the dev server over HTTP so that stack traces
        // are correct in errors/logs. This is much slower than eval, so
        // we only do it if needed (currently just Safari).
        // https://bugs.webkit.org/show_bug.cgi?id=137297
        // This path is also taken if a CSP disallows eval.
        if (!supportsSourceURL) {
            let promises = assets.map((asset)=>{
                var _hmrDownload;
                return (_hmrDownload = hmrDownload(asset)) === null || _hmrDownload === void 0 ? void 0 : _hmrDownload.catch((err)=>{
                    // Web extension fix
                    if (extCtx && extCtx.runtime && extCtx.runtime.getManifest().manifest_version == 3 && typeof ServiceWorkerGlobalScope != 'undefined' && global instanceof ServiceWorkerGlobalScope) {
                        extCtx.runtime.reload();
                        return;
                    }
                    throw err;
                });
            });
            scriptsToRemove = await Promise.all(promises);
        }
        assets.forEach(function(asset) {
            hmrApply(module.bundle.root, asset);
        });
    } finally{
        delete global.parcelHotUpdate;
        if (scriptsToRemove) scriptsToRemove.forEach((script)=>{
            if (script) {
                var _document$head2;
                (_document$head2 = document.head) === null || _document$head2 === void 0 || _document$head2.removeChild(script);
            }
        });
    }
}
function hmrApply(bundle /*: ParcelRequire */ , asset /*:  HMRAsset */ ) {
    var modules = bundle.modules;
    if (!modules) return;
    if (asset.type === 'css') reloadCSS();
    else if (asset.type === 'js') {
        let deps = asset.depsByBundle[bundle.HMR_BUNDLE_ID];
        if (deps) {
            if (modules[asset.id]) {
                // Remove dependencies that are removed and will become orphaned.
                // This is necessary so that if the asset is added back again, the cache is gone, and we prevent a full page reload.
                let oldDeps = modules[asset.id][1];
                for(let dep in oldDeps)if (!deps[dep] || deps[dep] !== oldDeps[dep]) {
                    let id = oldDeps[dep];
                    let parents = getParents(module.bundle.root, id);
                    if (parents.length === 1) hmrDelete(module.bundle.root, id);
                }
            }
            if (supportsSourceURL) // Global eval. We would use `new Function` here but browser
            // support for source maps is better with eval.
            (0, eval)(asset.output);
            // $FlowFixMe
            let fn = global.parcelHotUpdate[asset.id];
            modules[asset.id] = [
                fn,
                deps
            ];
        }
        // Always traverse to the parent bundle, even if we already replaced the asset in this bundle.
        // This is required in case modules are duplicated. We need to ensure all instances have the updated code.
        if (bundle.parent) hmrApply(bundle.parent, asset);
    }
}
function hmrDelete(bundle, id) {
    let modules = bundle.modules;
    if (!modules) return;
    if (modules[id]) {
        // Collect dependencies that will become orphaned when this module is deleted.
        let deps = modules[id][1];
        let orphans = [];
        for(let dep in deps){
            let parents = getParents(module.bundle.root, deps[dep]);
            if (parents.length === 1) orphans.push(deps[dep]);
        }
        // Delete the module. This must be done before deleting dependencies in case of circular dependencies.
        delete modules[id];
        delete bundle.cache[id];
        // Now delete the orphans.
        orphans.forEach((id)=>{
            hmrDelete(module.bundle.root, id);
        });
    } else if (bundle.parent) hmrDelete(bundle.parent, id);
}
function hmrAcceptCheck(bundle /*: ParcelRequire */ , id /*: string */ , depsByBundle /*: ?{ [string]: { [string]: string } }*/ ) {
    checkedAssets = {};
    if (hmrAcceptCheckOne(bundle, id, depsByBundle)) return true;
    // Traverse parents breadth first. All possible ancestries must accept the HMR update, or we'll reload.
    let parents = getParents(module.bundle.root, id);
    let accepted = false;
    while(parents.length > 0){
        let v = parents.shift();
        let a = hmrAcceptCheckOne(v[0], v[1], null);
        if (a) // If this parent accepts, stop traversing upward, but still consider siblings.
        accepted = true;
        else if (a !== null) {
            // Otherwise, queue the parents in the next level upward.
            let p = getParents(module.bundle.root, v[1]);
            if (p.length === 0) {
                // If there are no parents, then we've reached an entry without accepting. Reload.
                accepted = false;
                break;
            }
            parents.push(...p);
        }
    }
    return accepted;
}
function hmrAcceptCheckOne(bundle /*: ParcelRequire */ , id /*: string */ , depsByBundle /*: ?{ [string]: { [string]: string } }*/ ) {
    var modules = bundle.modules;
    if (!modules) return;
    if (depsByBundle && !depsByBundle[bundle.HMR_BUNDLE_ID]) {
        // If we reached the root bundle without finding where the asset should go,
        // there's nothing to do. Mark as "accepted" so we don't reload the page.
        if (!bundle.parent) {
            bundleNotFound = true;
            return true;
        }
        return hmrAcceptCheckOne(bundle.parent, id, depsByBundle);
    }
    if (checkedAssets[id]) return null;
    checkedAssets[id] = true;
    var cached = bundle.cache[id];
    if (!cached) return true;
    assetsToDispose.push([
        bundle,
        id
    ]);
    if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
        assetsToAccept.push([
            bundle,
            id
        ]);
        return true;
    }
    return false;
}
function hmrDisposeQueue() {
    // Dispose all old assets.
    for(let i = 0; i < assetsToDispose.length; i++){
        let id = assetsToDispose[i][1];
        if (!disposedAssets[id]) {
            hmrDispose(assetsToDispose[i][0], id);
            disposedAssets[id] = true;
        }
    }
    assetsToDispose = [];
}
function hmrDispose(bundle /*: ParcelRequire */ , id /*: string */ ) {
    var cached = bundle.cache[id];
    bundle.hotData[id] = {};
    if (cached && cached.hot) cached.hot.data = bundle.hotData[id];
    if (cached && cached.hot && cached.hot._disposeCallbacks.length) cached.hot._disposeCallbacks.forEach(function(cb) {
        cb(bundle.hotData[id]);
    });
    delete bundle.cache[id];
}
function hmrAccept(bundle /*: ParcelRequire */ , id /*: string */ ) {
    // Execute the module.
    bundle(id);
    // Run the accept callbacks in the new version of the module.
    var cached = bundle.cache[id];
    if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
        let assetsToAlsoAccept = [];
        cached.hot._acceptCallbacks.forEach(function(cb) {
            let additionalAssets = cb(function() {
                return getParents(module.bundle.root, id);
            });
            if (Array.isArray(additionalAssets) && additionalAssets.length) assetsToAlsoAccept.push(...additionalAssets);
        });
        if (assetsToAlsoAccept.length) {
            let handled = assetsToAlsoAccept.every(function(a) {
                return hmrAcceptCheck(a[0], a[1]);
            });
            if (!handled) return fullReload();
            hmrDisposeQueue();
        }
    }
}

},{}],"1SPX4":[function(require,module,exports,__globalThis) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "WeatherResponse", ()=>WeatherResponse);
parcelHelpers.export(exports, "Point", ()=>Point);
parcelHelpers.export(exports, "WeatherScore", ()=>WeatherScore);
parcelHelpers.export(exports, "DiscGolfCourse", ()=>DiscGolfCourse);
parcelHelpers.export(exports, "calcWeatherScore", ()=>calcWeatherScore);
// Haversine formula to get the distance between two points
parcelHelpers.export(exports, "distanceBetween", ()=>distanceBetween);
parcelHelpers.export(exports, "toCourse", ()=>toCourse);
parcelHelpers.export(exports, "chooseDefaultStartTime", ()=>chooseDefaultStartTime);
parcelHelpers.export(exports, "pageInit", ()=>pageInit) // Export chooseDefaultStartTime via its function definition
;
var _suncalc = require("suncalc");
var _suncalcDefault = parcelHelpers.interopDefault(_suncalc);
const { getTimes } = (0, _suncalcDefault.default);
const mockWeatherRequests = false;
const kmToMile = 0.621371;
const maxDecimalPlaces = 3;
const weatherPool = [];
const zipcodeLocations = new Map();
let courses;
let currentSortColumn = null;
let isAscending = true;
let displayedCourses = [];
class WeatherResponse {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(data){
        this.latitude = data.latitude;
        this.longitude = data.longitude;
        this.generationtime_ms = data.generationtime_ms;
        this.utc_offset_seconds = data.utc_offset_seconds;
        this.timezone = data.timezone;
        this.timezone_abbreviation = data.timezone_abbreviation;
        this.elevation = data.elevation;
        this.hourly_units = {
            time: data.hourly_units.time,
            temperature_2m: data.hourly_units.temperature_2m,
            precipitation_probability: data.hourly_units.precipitation_probability,
            precipitation: data.hourly_units.precipitation,
            windspeed_10m: data.hourly_units.windspeed_10m
        };
        this.hourly = {
            time: data.hourly.time,
            temperature_2m: data.hourly.temperature_2m,
            precipitation_probability: data.hourly.precipitation_probability,
            precipitation: data.hourly.precipitation,
            windspeed_10m: data.hourly.windspeed_10m
        };
    }
}
class Point {
    constructor(lat, lon){
        this.lat = lat;
        this.lon = lon;
    }
    toString() {
        return `${this.lat.toFixed(maxDecimalPlaces)}, ${this.lon.toFixed(maxDecimalPlaces)}`;
    }
}
class WeatherScore {
    constructor(score, summary){
        this.score = score;
        this.summary = summary;
    }
}
class DiscGolfCourse {
    constructor(name, numHoles, location){
        this.name = name;
        this.numHoles = numHoles;
        this.location = location;
        this.weatherScore = undefined;
        this.distanceAwayKm = NaN;
    }
    setWeatherScore(weatherScore) {
        this.weatherScore = weatherScore;
    }
    getWeatherScore() {
        if (!this.weatherScore) throw new Error(`Weather score undefined for ${this.name}`);
        return this.weatherScore;
    }
    toString() {
        return `${this.name},${this.numHoles},${this.location.toString()},${this.weatherScore}`;
    }
}
function calcWeatherScore(weather, startHour) {
    // Weather start time is in local time based on the lat/lon of the request
    const weatherStartTime = new Date(weather.hourly.time[0]);
    if (!(startHour >= 0 && startHour <= 23)) throw new Error("Invalid start hour");
    // Assume the round start time matches course's local time
    const roundStartTime = new Date(weatherStartTime.valueOf());
    roundStartTime.setHours(startHour);
    roundStartTime.setMinutes(0);
    roundStartTime.setSeconds(0);
    roundStartTime.setMilliseconds(0);
    // Calculate how far into the hours array to look for the forecasted hourly weather.
    const offsetHours = Math.floor((roundStartTime.valueOf() - weatherStartTime.valueOf()) / 3600000);
    if (offsetHours >= weather.hourly.precipitation_probability.length) throw new Error(`Insufficient weather data. Needed ${offsetHours + 1} hours, got ${weather.hourly.precipitation_probability.length}.`);
    const expectedRoundLength = 3;
    // isPreceeding = true means that the value is for the previous hour, not the instant value.
    // For example, since total precipitation is for the previous hour, we want arr[7:00] for a round
    // that starts at 6:00, since that value is how much it is expected to rain between 6:00 and 7:00.
    const avgValue = (arr, isPreceeding)=>{
        const offset = Math.min(offsetHours + (isPreceeding ? 1 : 0), 23);
        const duringRound = arr.slice(offset, offset + expectedRoundLength);
        return duringRound.reduce((a, b)=>a + b) / duringRound.length;
    };
    const precip = avgValue(weather.hourly.precipitation, true);
    const precipProbability = avgValue(weather.hourly.precipitation_probability, true);
    const temperature = avgValue(weather.hourly.temperature_2m, false);
    const windSpeed = avgValue(weather.hourly.windspeed_10m, true) * kmToMile;
    // Slight penalty if the temperature isn't in this range
    const minBestTemperatureF = 45;
    const maxBestTemperatureF = 82;
    const maxBestWindSpeedMPH = 25;
    const precipProbabilityScore = (1 - precipProbability / 100) * 2.5;
    // Any precipitation means there will be substantial rain
    const precipScore = Math.max(7.5 - 2.7 * precip, 0);
    const tempPenalty = (Math.max(minBestTemperatureF - temperature, 0) + Math.max(temperature - maxBestTemperatureF, 0)) / 3;
    const windPenalty = Math.max(windSpeed - maxBestWindSpeedMPH, 0) / 2;
    const score = Math.max(precipScore + precipProbabilityScore - tempPenalty - windPenalty, 1);
    // Calculate the weather score
    const components = `precip (mm): ${precip.toFixed(1)}, precipProbability (%): ${precipProbability.toFixed(1)}, windSpeed (mph): ${windSpeed.toFixed(1)}, temperature (F): ${temperature.toFixed(1)}`;
    const formula = `(${precipScore.toFixed(1)} precip score) + (${precipProbabilityScore.toFixed(1)} precip probability score) - (${tempPenalty.toFixed(1)} temperature score) - (${windPenalty.toFixed(1)} wind score) = ${score.toFixed(1)}`;
    return new WeatherScore(score, components + "\n\n" + formula);
}
function sortCourses(column) {
    if (column === currentSortColumn) isAscending = !isAscending;
    else {
        currentSortColumn = column;
        isAscending = true;
    }
    displayedCourses.sort((a, b)=>{
        let comparison = 0;
        switch(currentSortColumn){
            case "name":
                comparison = a.name.localeCompare(b.name);
                break;
            case "score":
                comparison = a.getWeatherScore().score - b.getWeatherScore().score;
                break;
            case "distance":
                comparison = a.distanceAwayKm - b.distanceAwayKm;
                break;
            case "holes":
                comparison = a.numHoles - b.numHoles;
                break;
        }
        return isAscending ? comparison : -comparison;
    });
    // Update header classes
    const headers = document.querySelectorAll("#nearbyCourses thead th");
    headers.forEach((th)=>{
        th.classList.remove("sort-asc", "sort-desc");
    });
    if (currentSortColumn) {
        const activeHeader = document.querySelector(`#nearbyCourses thead th[data-column="${currentSortColumn}"]`);
        if (activeHeader) activeHeader.classList.add(isAscending ? "sort-asc" : "sort-desc");
    }
    updateCoursesTable(displayedCourses);
}
async function fetchWeather(loc) {
    const timezone = "auto";
    // Use Open-Meteo API to fetch the weather forecast for a particular location
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&hourly=temperature_2m,precipitation_probability,precipitation,windspeed_10m&temperature_unit=fahrenheit&forecast_days=1&timezone=${timezone}`;
    // We don't need to fetch a new weather report if we already have one from nearby
    const sameWeatherThresholdMiles = 10;
    if (weatherPool.length > 0) {
        const closestExisting = weatherPool.reduce((a, b)=>{
            return distanceBetween(a[0], loc) < distanceBetween(b[0], loc) ? a : b;
        });
        const milesApart = distanceBetween(loc, closestExisting[0]) * kmToMile;
        if (milesApart < sameWeatherThresholdMiles) {
            console.log(`Returned cached weather report for ${loc.toString()}. (${milesApart.toFixed(1)} miles away from ${closestExisting[0].toString()})`);
            return closestExisting[1];
        }
    }
    console.log(`Fetching weather for ${loc.toString()}`);
    const weather = (async ()=>{
        if (mockWeatherRequests) return await fetchWeatherMock(loc);
        return await fetch(url).then(async (response)=>await response.json()).then((val)=>new WeatherResponse(val));
    })();
    weatherPool.push([
        loc,
        weather
    ]);
    return await weather;
}
async function fetchWeatherMock(_p) {
    const filePath = "data/sample_weather_response_st_helens.json";
    return await fetch(filePath).then(async (response)=>await response.text()).then(JSON.parse).then((val)=>new WeatherResponse(val));
}
function countDecimalPlaces(n) {
    const parts = n.split(".");
    if (parts.length === 1) return 0;
    return parts[1].length;
}
function onLocationUpdated() {
    const inputBox = document.getElementById("userLatLon");
    if (inputBox.value.includes(",")) {
        const [newLat, newLon] = inputBox.value.split(",");
        const p = new Point(parseFloat(newLat), parseFloat(newLon));
        if (countDecimalPlaces(newLat) > maxDecimalPlaces || countDecimalPlaces(newLon) > maxDecimalPlaces) inputBox.value = p.toString();
    }
}
function distanceBetween(point1, point2) {
    const earthRadiusKm = 6371;
    const dLat = degToRad(point2.lat - point1.lat);
    const dLng = degToRad(point2.lon - point1.lon);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(degToRad(point1.lat)) * Math.cos(degToRad(point2.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = earthRadiusKm * c; // Distance in km
    return d;
}
function degToRad(deg) {
    return deg * (Math.PI / 180);
}
async function getBrowserLocation() {
    return await new Promise((resolve, reject)=>{
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (!navigator.geolocation) // eslint-disable-next-line prefer-promise-reject-errors
        reject("Geolocation is not supported by this browser.");
        navigator.geolocation.getCurrentPosition((position)=>{
            const { latitude, longitude } = position.coords;
            const userLocation = new Point(latitude, longitude);
            resolve(userLocation);
        }, (error)=>{
            // eslint-disable-next-line prefer-promise-reject-errors
            reject(`Unable to retrieve user location: ${error.message}`);
        });
    });
}
async function fetchZipcodeDataset() {
    const filepath = "data/zipcode_lat_lon.csv";
    await fetch(filepath).then(async (response)=>await response.text()).then((contents)=>contents.split("\n")).then((lines)=>{
        lines.map((line)=>{
            const [zipcode, lat, lon] = line.split(",");
            zipcodeLocations.set(zipcode, new Point(parseFloat(lat), parseFloat(lon)));
        });
    });
}
async function getUserLocation() {
    const locationInputBox = document.getElementById("userLatLon");
    let result = undefined;
    try {
        let locationInput = locationInputBox.value;
        if (locationInput === "") throw new Error("No location provided");
        if (locationInput.includes(",")) {
            const [newLat, newLon] = locationInput.split(",");
            const p = new Point(parseFloat(newLat), parseFloat(newLon));
            if (isNaN(p.lat) || isNaN(p.lon)) throw new Error("Invalid lat/lon coordinate");
            result = p;
        } else {
            // Remove suffix from zipcodes of the form 12345-4545
            if (locationInput.includes("-")) locationInput = locationInput.substring(0, locationInput.indexOf("-"));
            if (zipcodeLocations.size === 0) await fetchZipcodeDataset();
            result = zipcodeLocations.get(locationInput);
            if (!result) throw new Error(`Unknown zipcode: ${result}`);
        }
    } catch (error) {
        console.error(error);
    }
    if (result === undefined) {
        locationInputBox.style.border = "none";
        locationInputBox.style.outline = "2px solid red";
        locationInputBox.style.borderRadius = "5px";
    } else {
        locationInputBox.style.border = "";
        locationInputBox.style.outline = "";
        locationInputBox.style.borderRadius = "";
    }
    return result;
}
function getDesiredCourseCount() {
    const desiredCourseCount = parseInt(document.getElementById("desiredCourseCount").value);
    const minCourses = 1;
    const maxCourses = 20;
    return Math.max(Math.min(desiredCourseCount, maxCourses), minCourses);
}
async function nearestCourses() {
    const loc = await getUserLocation();
    if (!loc) return;
    console.log(`Determining weather at courses near ${loc.toString()}`);
    fetchCourses().then(async (courses)=>{
        courses = courses.filter((course)=>course.numHoles >= 18);
        courses.forEach((course)=>course.distanceAwayKm = distanceBetween(course.location, loc));
        courses.sort((c1, c2)=>c1.distanceAwayKm - c2.distanceAwayKm);
        const n = getDesiredCourseCount();
        courses = courses.slice(0, n);
        await Promise.all(courses.map(async (course)=>{
            await fetchWeather(course.location).then((weather)=>{
                // TODO: Get startHour from the UI or a default value
                const defaultStartHour = 9; // Example: 9 AM
                course.setWeatherScore(calcWeatherScore(weather, defaultStartHour));
            });
        }));
        courses.sort((c1, c2)=>c2.getWeatherScore().score - c1.getWeatherScore().score);
        // Update displayedCourses with the fetched and initially sorted courses
        displayedCourses = courses;
        return courses;
    })// Pass displayedCourses to updateCoursesTable
    .then(()=>updateCoursesTable(displayedCourses));
    updateSunsetTime(loc);
}
function updateCoursesTable(courses) {
    const table = document.getElementById("nearbyCourses")?.getElementsByTagName("tbody")[0];
    if (table == null) return;
    // Clear existing courses
    table.innerHTML = "";
    for (const course of courses){
        const newRow = table.insertRow();
        newRow.insertCell().innerHTML = course.name;
        const scoreCell = newRow.insertCell();
        scoreCell.innerHTML = course.getWeatherScore().score.toFixed(1);
        scoreCell.addEventListener("click", (event)=>{
            const clickedCell = event.target;
            if (!clearInfoPopups()) {
                const span = document.createElement("span");
                span.textContent = course.getWeatherScore().summary;
                span.className = "more_info";
                clickedCell.appendChild(span);
            }
            event.stopPropagation();
        });
        scoreCell.title = course.getWeatherScore().summary;
        // Round to nearest 5, since the user's zipcode isn't very precise
        newRow.insertCell().innerHTML = (Math.round(course.distanceAwayKm * kmToMile / 5) * 5).toFixed(0);
        newRow.insertCell().innerHTML = course.numHoles.toFixed(0);
    }
}
function updateSunsetTime(loc) {
    const sunsetParagraph = document.getElementById("sunsetTime");
    if (sunsetParagraph === null) return;
    const today = new Date();
    const sunInfo = getTimes(today, loc.lat, loc.lon);
    const formattedTime = sunInfo.sunset.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true
    });
    sunsetParagraph.textContent = `Sunset today: ${formattedTime}`;
}
function clearInfoPopups() {
    const table = document.getElementById("nearbyCourses")?.getElementsByTagName("tbody")[0];
    if (table == null) return false;
    let removedAny = false;
    for (const row of table.rows)for (const childCell of row.cells){
        const childElement = childCell.querySelector(".more_info");
        if (childElement) {
            const duration_ms = 150;
            childElement.style.animation = `fadeOut linear ${duration_ms}ms`;
            setTimeout(()=>{
                childCell.removeChild(childElement);
            }, duration_ms);
            removedAny = true;
        }
    }
    return removedAny;
}
function toCourse(line) {
    const delimiter = ",";
    const sp = line.split(delimiter);
    return new DiscGolfCourse(sp[0], parseInt(sp[1]), new Point(parseFloat(sp[2]), parseFloat(sp[3])));
}
async function fetchCourses() {
    const getWeekNumber = (date)=>{
        const oneJan = new Date(date.getFullYear(), 0, 1);
        const numberOfDays = Math.floor((date.getSeconds() - oneJan.getSeconds()) / 86400);
        return Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
    };
    const currentDate = new Date();
    const weekNumber = getWeekNumber(currentDate);
    // Make sure the CSV is downloaded fresh at least every week (not cached)
    // by making the URL unique
    const filePath = "data/usa_courses.csv?v=" + weekNumber;
    if (!courses) courses = fetch(filePath).then(async (response)=>await response.text()).then((contents)=>{
        const lines = contents.split("\n");
        lines.shift();
        return lines.map(toCourse);
    });
    return await courses;
}
function chooseDefaultStartTime(currentDate) {
    const dayOfWeek = currentDate.getDay(); // 0 (Sunday) to 6 (Saturday)
    const currentHour = currentDate.getHours();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) return "17"; // 5:00 PM
    else {
        const nextHour = (currentHour + 1) % 24;
        return nextHour.toString();
    }
}
async function pageInit() {
    document.addEventListener("click", clearInfoPopups);
    document.addEventListener("touchStart", clearInfoPopups);
    document.getElementById("userLatLon").value = (await getBrowserLocation().catch((_err)=>new Point(33.6458, -82.2888))).toString();
    // Set default start time using the new refactored function
    const hourSelect = document.getElementById("hourSelect");
    if (hourSelect) {
        const defaultStartTimeValue = chooseDefaultStartTime(new Date());
        hourSelect.value = defaultStartTimeValue;
    }
    const nearestCoursesButton = document.getElementById("nearestCoursesButton");
    nearestCoursesButton?.addEventListener("click", nearestCourses);
    const locationInputBox = document.getElementById("userLatLon");
    locationInputBox?.addEventListener("change", onLocationUpdated);
    const tableHeaders = document.getElementById("nearbyCourses")?.getElementsByTagName("thead")[0]?.getElementsByTagName("th");
    if (tableHeaders) {
        const columnMappings = [
            "name",
            "score",
            "distance",
            "holes"
        ];
        for(let i = 0; i < tableHeaders.length; i++){
            const header = tableHeaders[i];
            const columnName = columnMappings[i];
            if (columnName) {
                header.dataset.column = columnName;
                header.addEventListener("click", ()=>sortCourses(columnName));
            }
        }
    }
}
pageInit();

},{"suncalc":"1qtzh","@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}],"1qtzh":[function(require,module,exports,__globalThis) {
/*
 (c) 2011-2015, Vladimir Agafonkin
 SunCalc is a JavaScript library for calculating sun/moon position and light phases.
 https://github.com/mourner/suncalc
*/ (function() {
    'use strict';
    // shortcuts for easier to read formulas
    var PI = Math.PI, sin = Math.sin, cos = Math.cos, tan = Math.tan, asin = Math.asin, atan = Math.atan2, acos = Math.acos, rad = PI / 180;
    // sun calculations are based on http://aa.quae.nl/en/reken/zonpositie.html formulas
    // date/time constants and conversions
    var dayMs = 86400000, J1970 = 2440588, J2000 = 2451545;
    function toJulian(date) {
        return date.valueOf() / dayMs - 0.5 + J1970;
    }
    function fromJulian(j) {
        return new Date((j + 0.5 - J1970) * dayMs);
    }
    function toDays(date) {
        return toJulian(date) - J2000;
    }
    // general calculations for position
    var e = rad * 23.4397; // obliquity of the Earth
    function rightAscension(l, b) {
        return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l));
    }
    function declination(l, b) {
        return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l));
    }
    function azimuth(H, phi, dec) {
        return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi));
    }
    function altitude(H, phi, dec) {
        return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H));
    }
    function siderealTime(d, lw) {
        return rad * (280.16 + 360.9856235 * d) - lw;
    }
    function astroRefraction(h) {
        if (h < 0) h = 0; // if h = -0.08901179 a div/0 would occur.
        // formula 16.4 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
        // 1.02 / tan(h + 10.26 / (h + 5.10)) h in degrees, result in arc minutes -> converted to rad:
        return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
    }
    // general sun calculations
    function solarMeanAnomaly(d) {
        return rad * (357.5291 + 0.98560028 * d);
    }
    function eclipticLongitude(M) {
        var C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M)), P = rad * 102.9372; // perihelion of the Earth
        return M + C + P + PI;
    }
    function sunCoords(d) {
        var M = solarMeanAnomaly(d), L = eclipticLongitude(M);
        return {
            dec: declination(L, 0),
            ra: rightAscension(L, 0)
        };
    }
    var SunCalc = {};
    // calculates sun position for a given date and latitude/longitude
    SunCalc.getPosition = function(date, lat, lng) {
        var lw = rad * -lng, phi = rad * lat, d = toDays(date), c = sunCoords(d), H = siderealTime(d, lw) - c.ra;
        return {
            azimuth: azimuth(H, phi, c.dec),
            altitude: altitude(H, phi, c.dec)
        };
    };
    // sun times configuration (angle, morning name, evening name)
    var times = SunCalc.times = [
        [
            -0.833,
            'sunrise',
            'sunset'
        ],
        [
            -0.3,
            'sunriseEnd',
            'sunsetStart'
        ],
        [
            -6,
            'dawn',
            'dusk'
        ],
        [
            -12,
            'nauticalDawn',
            'nauticalDusk'
        ],
        [
            -18,
            'nightEnd',
            'night'
        ],
        [
            6,
            'goldenHourEnd',
            'goldenHour'
        ]
    ];
    // adds a custom time to the times config
    SunCalc.addTime = function(angle, riseName, setName) {
        times.push([
            angle,
            riseName,
            setName
        ]);
    };
    // calculations for sun times
    var J0 = 0.0009;
    function julianCycle(d, lw) {
        return Math.round(d - J0 - lw / (2 * PI));
    }
    function approxTransit(Ht, lw, n) {
        return J0 + (Ht + lw) / (2 * PI) + n;
    }
    function solarTransitJ(ds, M, L) {
        return J2000 + ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L);
    }
    function hourAngle(h, phi, d) {
        return acos((sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d)));
    }
    function observerAngle(height) {
        return -2.076 * Math.sqrt(height) / 60;
    }
    // returns set time for the given sun altitude
    function getSetJ(h, lw, phi, dec, n, M, L) {
        var w = hourAngle(h, phi, dec), a = approxTransit(w, lw, n);
        return solarTransitJ(a, M, L);
    }
    // calculates sun times for a given date, latitude/longitude, and, optionally,
    // the observer height (in meters) relative to the horizon
    SunCalc.getTimes = function(date, lat, lng, height) {
        height = height || 0;
        var lw = rad * -lng, phi = rad * lat, dh = observerAngle(height), d = toDays(date), n = julianCycle(d, lw), ds = approxTransit(0, lw, n), M = solarMeanAnomaly(ds), L = eclipticLongitude(M), dec = declination(L, 0), Jnoon = solarTransitJ(ds, M, L), i, len, time, h0, Jset, Jrise;
        var result = {
            solarNoon: fromJulian(Jnoon),
            nadir: fromJulian(Jnoon - 0.5)
        };
        for(i = 0, len = times.length; i < len; i += 1){
            time = times[i];
            h0 = (time[0] + dh) * rad;
            Jset = getSetJ(h0, lw, phi, dec, n, M, L);
            Jrise = Jnoon - (Jset - Jnoon);
            result[time[1]] = fromJulian(Jrise);
            result[time[2]] = fromJulian(Jset);
        }
        return result;
    };
    // moon calculations, based on http://aa.quae.nl/en/reken/hemelpositie.html formulas
    function moonCoords(d) {
        var L = rad * (218.316 + 13.176396 * d), M = rad * (134.963 + 13.064993 * d), F = rad * (93.272 + 13.229350 * d), l = L + rad * 6.289 * sin(M), b = rad * 5.128 * sin(F), dt = 385001 - 20905 * cos(M); // distance to the moon in km
        return {
            ra: rightAscension(l, b),
            dec: declination(l, b),
            dist: dt
        };
    }
    SunCalc.getMoonPosition = function(date, lat, lng) {
        var lw = rad * -lng, phi = rad * lat, d = toDays(date), c = moonCoords(d), H = siderealTime(d, lw) - c.ra, h = altitude(H, phi, c.dec), // formula 14.1 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
        pa = atan(sin(H), tan(phi) * cos(c.dec) - sin(c.dec) * cos(H));
        h = h + astroRefraction(h); // altitude correction for refraction
        return {
            azimuth: azimuth(H, phi, c.dec),
            altitude: h,
            distance: c.dist,
            parallacticAngle: pa
        };
    };
    // calculations for illumination parameters of the moon,
    // based on http://idlastro.gsfc.nasa.gov/ftp/pro/astro/mphase.pro formulas and
    // Chapter 48 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
    SunCalc.getMoonIllumination = function(date) {
        var d = toDays(date || new Date()), s = sunCoords(d), m = moonCoords(d), sdist = 149598000, phi = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra)), inc = atan(sdist * sin(phi), m.dist - sdist * cos(phi)), angle = atan(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) - cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));
        return {
            fraction: (1 + cos(inc)) / 2,
            phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI,
            angle: angle
        };
    };
    function hoursLater(date, h) {
        return new Date(date.valueOf() + h * dayMs / 24);
    }
    // calculations for moon rise/set times are based on http://www.stargazing.net/kepler/moonrise.html article
    SunCalc.getMoonTimes = function(date, lat, lng, inUTC) {
        var t = new Date(date);
        if (inUTC) t.setUTCHours(0, 0, 0, 0);
        else t.setHours(0, 0, 0, 0);
        var hc = 0.133 * rad, h0 = SunCalc.getMoonPosition(t, lat, lng).altitude - hc, h1, h2, rise, set, a, b, xe, ye, d, roots, x1, x2, dx;
        // go in 2-hour chunks, each time seeing if a 3-point quadratic curve crosses zero (which means rise or set)
        for(var i = 1; i <= 24; i += 2){
            h1 = SunCalc.getMoonPosition(hoursLater(t, i), lat, lng).altitude - hc;
            h2 = SunCalc.getMoonPosition(hoursLater(t, i + 1), lat, lng).altitude - hc;
            a = (h0 + h2) / 2 - h1;
            b = (h2 - h0) / 2;
            xe = -b / (2 * a);
            ye = (a * xe + b) * xe + h1;
            d = b * b - 4 * a * h1;
            roots = 0;
            if (d >= 0) {
                dx = Math.sqrt(d) / (Math.abs(a) * 2);
                x1 = xe - dx;
                x2 = xe + dx;
                if (Math.abs(x1) <= 1) roots++;
                if (Math.abs(x2) <= 1) roots++;
                if (x1 < -1) x1 = x2;
            }
            if (roots === 1) {
                if (h0 < 0) rise = i + x1;
                else set = i + x1;
            } else if (roots === 2) {
                rise = i + (ye < 0 ? x2 : x1);
                set = i + (ye < 0 ? x1 : x2);
            }
            if (rise && set) break;
            h0 = h2;
        }
        var result = {};
        if (rise) result.rise = hoursLater(t, rise);
        if (set) result.set = hoursLater(t, set);
        if (!rise && !set) result[ye > 0 ? 'alwaysUp' : 'alwaysDown'] = true;
        return result;
    };
    module.exports = SunCalc;
})();

},{}],"jnFvT":[function(require,module,exports,__globalThis) {
exports.interopDefault = function(a) {
    return a && a.__esModule ? a : {
        default: a
    };
};
exports.defineInteropFlag = function(a) {
    Object.defineProperty(a, '__esModule', {
        value: true
    });
};
exports.exportAll = function(source, dest) {
    Object.keys(source).forEach(function(key) {
        if (key === 'default' || key === '__esModule' || Object.prototype.hasOwnProperty.call(dest, key)) return;
        Object.defineProperty(dest, key, {
            enumerable: true,
            get: function() {
                return source[key];
            }
        });
    });
    return dest;
};
exports.export = function(dest, destName, get) {
    Object.defineProperty(dest, destName, {
        enumerable: true,
        get: get
    });
};

},{}]},["kZ8pU","1SPX4"], "1SPX4", "parcelRequire1e0a", {})

//# sourceMappingURL=forecasters-edge.fb736eb8.js.map
