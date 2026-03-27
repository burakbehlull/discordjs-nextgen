import type { Message } from '../structures/Message.js';
import type { Interaction } from '../structures/Interaction.js';
import type { User } from '../structures/User.js';
import type { Guild } from '../structures/Guild.js';
import type { Channel } from '../structures/Channel.js';
import type { MessageReplyOptions } from '../structures/Message.js';
import type { InteractionReplyOptions } from '../structures/Interaction.js';
import type { Modal } from '../builders/ModalBuilder.js';
import type { App } from '../client/App.js';
export declare class Context {
    private source;
    readonly user: User;
    readonly guild: Guild | null;
    readonly channel: Channel | null;
    readonly isInteraction: boolean;
    readonly args: string[];
    app?: App;
    constructor(source: Message | Interaction, args?: string[]);
    reply(options: string | MessageReplyOptions | InteractionReplyOptions): Promise<void>;
    deferReply(ephemeral?: boolean): Promise<void>;
    followUp(options: string | MessageReplyOptions | InteractionReplyOptions): Promise<void>;
    editReply(options: string | InteractionReplyOptions): Promise<void>;
    showModal(modal: Modal | Record<string, any> | string): Promise<void>;
    get author(): User;
    get message(): Message | null;
    get interaction(): Interaction | null;
    get createdAt(): Date;
    get commandName(): string | null;
    get customId(): string | null;
    get isCommand(): boolean;
    get isModalSubmit(): boolean;
    get values(): Record<string, string> | null;
    get memberPermissions(): string | null;
}
//# sourceMappingURL=Context.d.ts.map