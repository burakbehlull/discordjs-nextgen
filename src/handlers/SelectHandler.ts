import { FileLoader } from '../utils/FileLoader.js';
import { Select } from '../builders/SelectBuilder.js';
import { Logger } from '../utils/Logger.js';
import { Context } from '../structures/Context.js';

export interface SelectHandlerOptions {
  folder?: string;
}

export class SelectHandlerManager {
  private readonly selects: Map<string, Select> = new Map();
  private readonly handlers: Array<{ customId: string | RegExp; run: (ctx: Context) => Promise<void> | void }> = [];

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

  addHandler(customId: string | RegExp, run: (ctx: Context) => Promise<void> | void): void {
    this.handlers.push({ customId, run });
  }

  get(customId: string): Select | undefined {
    return this.selects.get(customId);
  }

  getHandler(customId: string): ((ctx: Context) => Promise<void> | void) | undefined {
    // 1. Try static Select Builder handler first
    const select = this.selects.get(customId);
    if (select?.handler) return select.handler;

    // 2. Try dynamic callback handlers (string / RegExp customId matching)
    const handlerEntry = this.handlers.find((entry) => {
      if (typeof entry.customId === 'string') {
        return entry.customId === customId;
      }
      return entry.customId.test(customId);
    });

    return handlerEntry?.run;
  }

  get all(): Map<string, Select> {
    return this.selects;
  }
}
