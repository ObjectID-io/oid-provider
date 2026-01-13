"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDID = exports.DEFAULT_SHARED_CONFIG_OBJECT_ID = exports.DEFAULT_CONFIG_PACKAGE_IDS = exports.loadPublicConfig = exports.loadEffectiveConfig = exports.createObjectIdApi = void 0;
var api_1 = require("./api");
Object.defineProperty(exports, "createObjectIdApi", { enumerable: true, get: function () { return api_1.createObjectIdApi; } });
__exportStar(require("./types"), exports);
var config_1 = require("./onchain/config");
Object.defineProperty(exports, "loadEffectiveConfig", { enumerable: true, get: function () { return config_1.loadEffectiveConfig; } });
Object.defineProperty(exports, "loadPublicConfig", { enumerable: true, get: function () { return config_1.loadPublicConfig; } });
var defaults_1 = require("./onchain/defaults");
Object.defineProperty(exports, "DEFAULT_CONFIG_PACKAGE_IDS", { enumerable: true, get: function () { return defaults_1.DEFAULT_CONFIG_PACKAGE_IDS; } });
var defaults_2 = require("./onchain/defaults");
Object.defineProperty(exports, "DEFAULT_SHARED_CONFIG_OBJECT_ID", { enumerable: true, get: function () { return defaults_2.DEFAULT_SHARED_CONFIG_OBJECT_ID; } });
var identity_1 = require("./onchain/identity");
Object.defineProperty(exports, "resolveDID", { enumerable: true, get: function () { return identity_1.resolveDID; } });
//# sourceMappingURL=index.js.map