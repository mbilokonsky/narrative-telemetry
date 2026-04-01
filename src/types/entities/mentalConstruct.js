"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwarenessLevel = exports.CertaintyLevel = exports.MentalConstructType = void 0;
var MentalConstructType;
(function (MentalConstructType) {
    MentalConstructType["FACT"] = "fact";
    MentalConstructType["BELIEF"] = "belief";
    MentalConstructType["OPINION"] = "opinion";
    MentalConstructType["MEMORY"] = "memory";
    MentalConstructType["SKILL"] = "skill";
    MentalConstructType["SPECULATION"] = "speculation";
})(MentalConstructType || (exports.MentalConstructType = MentalConstructType = {}));
var CertaintyLevel;
(function (CertaintyLevel) {
    CertaintyLevel["CERTAIN"] = "certain";
    CertaintyLevel["PROBABLE"] = "probable";
    CertaintyLevel["POSSIBLE"] = "possible";
    CertaintyLevel["DOUBTFUL"] = "doubtful";
    CertaintyLevel["UNKNOWN"] = "unknown";
})(CertaintyLevel || (exports.CertaintyLevel = CertaintyLevel = {}));
var AwarenessLevel;
(function (AwarenessLevel) {
    AwarenessLevel["CONSCIOUS"] = "conscious";
    AwarenessLevel["SUBCONSCIOUS"] = "subconscious";
    AwarenessLevel["UNCONSCIOUS"] = "unconscious";
})(AwarenessLevel || (exports.AwarenessLevel = AwarenessLevel = {}));
