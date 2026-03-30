import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

export type FileLoadTransform = (
  filePath: string,
) => Promise<string | null | undefined> | string | null | undefined;

export class FileLoader {
  private static transforms: FileLoadTransform[] = [];

  static registerTransform(transform: FileLoadTransform): void {
    this.transforms.push(transform);
  }

  static clearTransforms(): void {
    this.transforms = [];
  }

  static async loadFiles<T>(dir: string): Promise<T[]> {
    const results: T[] = [];
    const absolutePath = path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);

    if (!fs.existsSync(absolutePath)) {
      console.warn(`[FileLoader] Klasor bulunamadi: ${absolutePath}`);
      return [];
    }

    const files = fs.readdirSync(absolutePath, { withFileTypes: true });

    for (const file of files) {
      const filePath = path.join(absolutePath, file.name);

      if (file.isDirectory()) {
        const nested = await this.loadFiles<T>(filePath);
        results.push(...nested);
        continue;
      }

      if (!this.isSupportedFile(file.name)) {
        continue;
      }

      try {
        let imported: any;
        let loadPath = filePath;

        for (const transform of this.transforms) {
          const transformedPath = await transform(filePath);
          if (transformedPath) {
            loadPath = transformedPath;
            break;
          }
        }

        try {
          const resolvedPath = require.resolve(loadPath);
          delete require.cache[resolvedPath];
          imported = require(resolvedPath);
        } catch {
          const fileUrl = pathToFileURL(loadPath).href;
          imported = await import(fileUrl);
        }

        const command = imported.default || imported;
        if (command) {
          results.push(command);
        }
      } catch (error) {
        console.error(`[FileLoader] Dosya yuklenirken hata olustu: ${filePath}`, error);
      }
    }

    return results;
  }

  private static isSupportedFile(fileName: string): boolean {
    return (
      fileName.endsWith('.js') ||
      fileName.endsWith('.ts') ||
      fileName.endsWith('.jsx') ||
      fileName.endsWith('.tsx')
    );
  }
}
