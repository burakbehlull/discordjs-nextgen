import type { RawEmbed } from '../types/raw';
export type EmbedField = {
    name: string;
    value: string;
    inline?: boolean;
};
export declare class EmbedBuilder {
    private data;
    setTitle(title: string): this;
    setDescription(description: string): this;
    setURL(url: string): this;
    setColor(color: number | `#${string}`): this;
    setTimestamp(timestamp?: Date | number): this;
    setFooter(text: string, iconURL?: string): this;
    setImage(url: string): this;
    setThumbnail(url: string): this;
    setAuthor(name: string, options?: {
        url?: string;
        iconURL?: string;
    }): this;
    addField(name: string, value: string, inline?: boolean): this;
    addFields(...fields: EmbedField[]): this;
    toJSON(): RawEmbed;
}
//# sourceMappingURL=EmbedBuilder.d.ts.map