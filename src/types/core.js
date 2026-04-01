"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NarratorPerspective = exports.RelationshipLabel = exports.RealmType = exports.NarrativeEventType = exports.StorySpanType = void 0;
var StorySpanType;
(function (StorySpanType) {
    StorySpanType["STORY"] = "story";
    StorySpanType["ACT"] = "act";
    StorySpanType["SCENE"] = "scene";
    StorySpanType["BEAT"] = "beat";
})(StorySpanType || (exports.StorySpanType = StorySpanType = {}));
var NarrativeEventType;
(function (NarrativeEventType) {
    NarrativeEventType["ACTION"] = "action";
    NarrativeEventType["DIALOGUE"] = "dialogue";
    NarrativeEventType["REVELATION"] = "revelation";
    NarrativeEventType["DECISION"] = "decision";
    NarrativeEventType["ENVIRONMENTAL"] = "environmental";
})(NarrativeEventType || (exports.NarrativeEventType = NarrativeEventType = {}));
var RealmType;
(function (RealmType) {
    RealmType["MATERIAL_REALITY"] = "material_reality";
    RealmType["DREAM"] = "dream";
    RealmType["MEMORY"] = "memory";
    RealmType["VISION"] = "vision";
    RealmType["ALTERNATE_REALITY"] = "alternate_reality";
    RealmType["VIRTUAL_REALITY"] = "virtual_reality";
    RealmType["HYPOTHETICAL_REALITY"] = "hypothetical_reality";
})(RealmType || (exports.RealmType = RealmType = {}));
var RelationshipLabel;
(function (RelationshipLabel) {
    RelationshipLabel["FAMILY"] = "family";
    RelationshipLabel["FRIEND"] = "friend";
    RelationshipLabel["ENEMY"] = "enemy";
    RelationshipLabel["ALLY"] = "ally";
    RelationshipLabel["RIVAL"] = "rival";
    RelationshipLabel["LOVER"] = "lover";
    RelationshipLabel["MENTOR"] = "mentor";
    RelationshipLabel["SUBORDINATE"] = "subordinate";
    RelationshipLabel["LEADER"] = "leader";
})(RelationshipLabel || (exports.RelationshipLabel = RelationshipLabel = {}));
var NarratorPerspective;
(function (NarratorPerspective) {
    NarratorPerspective["FIRST_PERSON"] = "first_person";
    NarratorPerspective["SECOND_PERSON"] = "second_person";
    NarratorPerspective["THIRD_PERSON_LIMITED"] = "third_person_limited";
    NarratorPerspective["THIRD_PERSON_OMNISCIENT"] = "third_person_omniscient";
})(NarratorPerspective || (exports.NarratorPerspective = NarratorPerspective = {}));
