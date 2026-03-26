export type ButtonStyle = 'primary' | 'secondary' | 'green' | 'red' | 'link';
export declare class ButtonBuilder {
    private data;
    setCustomId(id: string): this;
    setLabel(label: string): this;
    setStyle(style: ButtonStyle): this;
    setURL(url: string): this;
    setDisabled(disabled?: boolean): this;
    setEmoji(name: string, id?: string, animated?: boolean): this;
    toJSON(): Record<string, unknown>;
}
export declare class ActionRowBuilder {
    private buttons;
    addButton(button: ButtonBuilder): this;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=ButtonBuilder.d.ts.map