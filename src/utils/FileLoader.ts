import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

export class FileLoader {
  static async loadFiles<T>(dir: string): Promise<T[]> {
    const results: T[] = [];
    const absolutePath = path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);

    if (!fs.existsSync(absolutePath)) {
      console.warn(`[FileLoader] Klasör bulunamadı: ${absolutePath}`);
      return [];
    }

    const files = fs.readdirSync(absolutePath, { withFileTypes: true });

    for (const file of files) {
      const filePath = path.join(absolutePath, file.name);

      if (file.isDirectory()) {
        const nested = await this.loadFiles<T>(filePath);
        results.push(...nested);
      } else if (file.name.endsWith('.ts') || file.name.endsWith('.js')) {
        // Dinamik olarak dosyayı yükle
        try {
          let imported: any;
          
          // CommonJS ve ESM uyumluluğu için
          try {
            // Önce standard require deniyoruz (CJS/ts-node için)
            // Not: require.resolve ile dosyanın varlığını teyit edebiliriz
            const resolvedPath = require.resolve(filePath);
            // Cache'i temizle (Opsiyonel: Komutları reload etmek istersen)
            delete require.cache[resolvedPath];
            imported = require(resolvedPath);
          } catch (err) {
            // Eğer require başarısız olursa (ESM ortamı), import() kullanıyoruz
            const fileUrl = pathToFileURL(filePath).href;
            imported = await import(fileUrl);
          }

          // Default export varsa onu al, yoksa direkt import edilen objeyi al
          const command = imported.default || imported;
          if (command) {
            results.push(command);
          }
        } catch (error) {
          console.error(`[FileLoader] Dosya yüklenirken hata oluştu: ${filePath}`, error);
        }
      }
    }

    return results;
  }
}
