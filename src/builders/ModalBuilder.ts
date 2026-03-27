import { RawComponent, RawTextInputComponent } from '../types/raw.js';
import { Context } from '../structures/Context.js';
import { MiddlewareFunction } from '../utils/MiddlewareManager.js';

export interface TextInputOptions {
  label: string;
  placeholder?: string;
  min?: number;
  max?: number;
  required?: boolean;
  value?: string;
}

export class Modal {
  private _customId: string;
  private _title: string = 'Modal';
  private _components: RawComponent[] = [];
  private _middleware: MiddlewareFunction[] = [];
  private _onSubmit?: (ctx: Context) => Promise<void> | void;
  public validationRules: Map<string, TextInputOptions> = new Map();

  constructor(customId: string) {
    this._customId = customId;
  }

  static create(customId: string): Modal {
    return new Modal(customId);
  }

  get customId(): string {
    return this._customId;
  }

  get middleware(): MiddlewareFunction[] {
    return this._middleware;
  }

  title(title: string): this {
    this._title = title;
    return this;
  }

  short(customId: string, options: TextInputOptions): this {
    return this.addTextInput(customId, 1, options);
  }

  paragraph(customId: string, options: TextInputOptions): this {
    return this.addTextInput(customId, 2, options);
  }

  private addTextInput(customId: string, style: number, options: TextInputOptions): this {
    this.validationRules.set(customId, options);

    const textInput: RawTextInputComponent = {
      type: 4,
      custom_id: customId,
      style,
      label: options.label,
      min_length: options.min,
      max_length: options.max,
      required: options.required ?? true,
      value: options.value,
      placeholder: options.placeholder,
    };

    this._components.push({
      type: 1, // ActionRow
      components: [textInput],
    });

    return this;
  }

  use(middleware: MiddlewareFunction): this {
    this._middleware.push(middleware);
    return this;
  }

  onSubmit(callback: (ctx: Context) => Promise<void> | void): this {
    this._onSubmit = callback;
    return this;
  }

  async run(ctx: Context): Promise<void> {
    if (!this._onSubmit) return;
    
    // Automatic Validation
    const values = ctx.values;
    if (values) {
      for (const [key, value] of Object.entries(values)) {
        const rule = this.validationRules.get(key);
        if (rule) {
          const valStr = String(value);
          if (rule.min && valStr.length < rule.min) {
            await ctx.reply({ content: `\`${rule.label}\` alanı en az ${rule.min} karakter olmalıdır.`, ephemeral: true });
            return;
          }
          if (rule.max && valStr.length > rule.max) {
            await ctx.reply({ content: `\`${rule.label}\` alanı en fazla ${rule.max} karakter olabilir.`, ephemeral: true });
            return;
          }
        }
      }
    }

    await this._onSubmit(ctx);
  }

  toJSON(): any {
    return {
      title: this._title,
      custom_id: this._customId,
      components: this._components,
    };
  }
}
