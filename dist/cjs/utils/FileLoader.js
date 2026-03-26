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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileLoader = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
class FileLoader {
    static async loadFiles(dir) {
        const results = [];
        const absolutePath = path_1.default.isAbsolute(dir) ? dir : path_1.default.join(process.cwd(), dir);
        if (!fs_1.default.existsSync(absolutePath)) {
            console.warn(`[FileLoader] Klasör bulunamadı: ${absolutePath}`);
            return [];
        }
        const files = fs_1.default.readdirSync(absolutePath, { withFileTypes: true });
        for (const file of files) {
            const filePath = path_1.default.join(absolutePath, file.name);
            if (file.isDirectory()) {
                const nested = await this.loadFiles(filePath);
                results.push(...nested);
            }
            else if (file.name.endsWith('.ts') || file.name.endsWith('.js')) {
                // Dinamik olarak dosyayı yükle
                try {
                    let imported;
                    // CommonJS ve ESM uyumluluğu için
                    try {
                        // Önce standard require deniyoruz (CJS/ts-node için)
                        // Not: require.resolve ile dosyanın varlığını teyit edebiliriz
                        const resolvedPath = require.resolve(filePath);
                        // Cache'i temizle (Opsiyonel: Komutları reload etmek istersen)
                        delete require.cache[resolvedPath];
                        imported = require(resolvedPath);
                    }
                    catch (err) {
                        // Eğer require başarısız olursa (ESM ortamı), import() kullanıyoruz
                        const fileUrl = (0, url_1.pathToFileURL)(filePath).href;
                        imported = await Promise.resolve(`${fileUrl}`).then(s => __importStar(require(s)));
                    }
                    // Default export varsa onu al, yoksa direkt import edilen objeyi al
                    const command = imported.default || imported;
                    if (command) {
                        results.push(command);
                    }
                }
                catch (error) {
                    console.error(`[FileLoader] Dosya yüklenirken hata oluştu: ${filePath}`, error);
                }
            }
        }
        return results;
    }
}
exports.FileLoader = FileLoader;
//# sourceMappingURL=FileLoader.js.map