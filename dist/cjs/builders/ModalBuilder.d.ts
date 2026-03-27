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
export declare class Modal {
    private _customId;
    private _title;
    private _components;
    private _middleware;
    private _onSubmit?;
    validationRules: Map<string, TextInputOptions>;
    constructor(customId: string);
    static create(customId: string): Modal;
    get customId(): string;
    get middleware(): MiddlewareFunction[];
    title(title: string): this;
    short(customId: string, options: TextInputOptions): this;
    paragraph(customId: string, options: TextInputOptions): this;
    private addTextInput;
    use(middleware: MiddlewareFunction): this;
    onSubmit(callback: (ctx: Context) => Promise<void> | void): this;
    run(ctx: Context): Promise<void>;
    toJSON(): any;
}
//# sourceMappingURL=ModalBuilder.d.ts.map