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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveStoryModel = saveStoryModel;
exports.loadStoryModel = loadStoryModel;
exports.listStoryModels = listStoryModels;
exports.deleteStoryModel = deleteStoryModel;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}
function storyPath(slug) {
    return path.join(DATA_DIR, `${slug}.json`);
}
function slugify(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
function saveStoryModel(model) {
    ensureDataDir();
    const slug = slugify(model.text.title);
    const filePath = storyPath(slug);
    fs.writeFileSync(filePath, JSON.stringify(model, null, 2), 'utf-8');
    return filePath;
}
function loadStoryModel(slug) {
    const filePath = storyPath(slug);
    if (!fs.existsSync(filePath)) {
        throw new Error(`No story model found at ${filePath}`);
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
}
function listStoryModels() {
    ensureDataDir();
    return fs
        .readdirSync(DATA_DIR)
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace(/\.json$/, ''));
}
function deleteStoryModel(slug) {
    const filePath = storyPath(slug);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}
