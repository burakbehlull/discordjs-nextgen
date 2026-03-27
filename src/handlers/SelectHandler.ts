import { FileLoader } from '../utils/FileLoader.js';
import { Select } from '../builders/SelectBuilder.js';
import { Logger } from '../utils/Logger.js';

export interface SelectHandlerOptions {
  folder?: string;
}

export class SelectHandlerManager {
  private readonly selects: Map<string, Select> = new Map();

  constructor(options: SelectHandlerOptions = {}) {
    if (options.folder) {
      this.loadFromFolder(options.folder);
    }
  }

  async loadFromFolder(folder: string): Promise<void> {
    try {
      const files = await FileLoader.loadFiles<Select>(folder);
      for (const select of files) {
        if (select instanceof Select) {
          this.addSelect(select);
        }
      }
      Logger.success(`${files.length} Select Menu yüklendi.`);
    } catch (err: any) {
      Logger.error(`Select Menu yükleme hatası: ${err.message}`);
    }
  }

  addSelect(select: Select): void {
    this.selects.set(select.customId, select);
  }

  get(customId: string): Select | undefined {
    return this.selects.get(customId);
  }

  get all(): Map<string, Select> {
    return this.selects;
  }
}
