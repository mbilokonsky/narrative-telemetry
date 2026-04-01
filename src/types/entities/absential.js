"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbsentialRelationship = exports.EntityAbsentialRelationship = exports.AbsentialStatus = exports.AbsentialType = void 0;
var AbsentialType;
(function (AbsentialType) {
    AbsentialType["DESIRE"] = "desire";
    AbsentialType["FEAR"] = "fear";
    AbsentialType["GOAL"] = "goal";
    AbsentialType["NEED"] = "need";
    AbsentialType["EXPECTATION"] = "expectation";
    AbsentialType["LACK"] = "lack";
    AbsentialType["POTENTIAL"] = "potential";
    AbsentialType["TRIGGER"] = "trigger";
})(AbsentialType || (exports.AbsentialType = AbsentialType = {}));
var AbsentialStatus;
(function (AbsentialStatus) {
    AbsentialStatus["UNSATISFIED"] = "unsatisfied";
    AbsentialStatus["CANCELED"] = "canceled";
    AbsentialStatus["UNSATISFIED_MIXED"] = "unsatisfied_mixed";
    AbsentialStatus["RESOLVED_SATISFIED"] = "resolved_satisfied";
    AbsentialStatus["RESOLVED_BLOCKED"] = "resolved_blocked";
    AbsentialStatus["RESOLVED_MIXED"] = "resolved_mixed";
})(AbsentialStatus || (exports.AbsentialStatus = AbsentialStatus = {}));
var EntityAbsentialRelationship;
(function (EntityAbsentialRelationship) {
    EntityAbsentialRelationship["TARGET"] = "target";
    EntityAbsentialRelationship["OBSTACLE"] = "obstacle";
    EntityAbsentialRelationship["FACILITATOR"] = "facilitator";
    EntityAbsentialRelationship["INFLUENCED_BY"] = "influenced_by";
    EntityAbsentialRelationship["INFLUENCES"] = "influences";
    EntityAbsentialRelationship["CATALYST"] = "catalyst";
    EntityAbsentialRelationship["RESOLVER"] = "resolver";
    EntityAbsentialRelationship["CREATOR"] = "creator";
    EntityAbsentialRelationship["BENEFICIARY"] = "beneficiary";
    EntityAbsentialRelationship["VICTIM"] = "victim";
})(EntityAbsentialRelationship || (exports.EntityAbsentialRelationship = EntityAbsentialRelationship = {}));
var AbsentialRelationship;
(function (AbsentialRelationship) {
    AbsentialRelationship["SUPPORTS"] = "supports";
    AbsentialRelationship["HINDERS"] = "hinders";
    AbsentialRelationship["PREREQUISITE"] = "prerequisite";
    AbsentialRelationship["ALTERNATIVE"] = "alternative";
    AbsentialRelationship["CONTRADICTS"] = "contradicts";
    AbsentialRelationship["ENABLES"] = "enables";
    AbsentialRelationship["MOTIVATES"] = "motivates";
    AbsentialRelationship["RESOLVES"] = "resolves";
})(AbsentialRelationship || (exports.AbsentialRelationship = AbsentialRelationship = {}));
