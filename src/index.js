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
exports.deleteStoryModel = exports.listStoryModels = exports.loadStoryModel = exports.saveStoryModel = void 0;
__exportStar(require("./types"), exports);
var persistence_1 = require("./persistence");
Object.defineProperty(exports, "saveStoryModel", { enumerable: true, get: function () { return persistence_1.saveStoryModel; } });
Object.defineProperty(exports, "loadStoryModel", { enumerable: true, get: function () { return persistence_1.loadStoryModel; } });
Object.defineProperty(exports, "listStoryModels", { enumerable: true, get: function () { return persistence_1.listStoryModels; } });
Object.defineProperty(exports, "deleteStoryModel", { enumerable: true, get: function () { return persistence_1.deleteStoryModel; } });
