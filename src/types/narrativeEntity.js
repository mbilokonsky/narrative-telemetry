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
exports.NonDiegeticEntityType = exports.DiegeticEntityType = void 0;
var DiegeticEntityType;
(function (DiegeticEntityType) {
    DiegeticEntityType["CHARACTER"] = "character";
    DiegeticEntityType["SETTING"] = "setting";
    DiegeticEntityType["ITEM"] = "item";
    DiegeticEntityType["FACTION"] = "faction";
})(DiegeticEntityType || (exports.DiegeticEntityType = DiegeticEntityType = {}));
var NonDiegeticEntityType;
(function (NonDiegeticEntityType) {
    NonDiegeticEntityType["READER"] = "reader";
    NonDiegeticEntityType["THEME"] = "theme";
    NonDiegeticEntityType["SYMBOL"] = "symbol";
    NonDiegeticEntityType["AUTHOR"] = "author";
    NonDiegeticEntityType["NARRATOR"] = "narrator";
})(NonDiegeticEntityType || (exports.NonDiegeticEntityType = NonDiegeticEntityType = {}));
__exportStar(require("./entities/absential"), exports);
__exportStar(require("./entities/author"), exports);
__exportStar(require("./entities/character"), exports);
__exportStar(require("./entities/faction"), exports);
__exportStar(require("./entities/item"), exports);
__exportStar(require("./entities/mentalConstruct"), exports);
__exportStar(require("./entities/narrator"), exports);
__exportStar(require("./entities/reader"), exports);
__exportStar(require("./entities/relationship"), exports);
__exportStar(require("./entities/setting"), exports);
__exportStar(require("./entities/symbol"), exports);
__exportStar(require("./entities/theme"), exports);
