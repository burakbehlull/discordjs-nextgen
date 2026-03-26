import type { Message } from '../structures/Message';
import type { Interaction } from '../structures/Interaction';
import type { User } from '../structures/User';
import type { Guild } from '../structures/Guild';
import type { Channel } from '../structures/Channel';
import type { MessageReplyOptions } from '../structures/Message';
import type { InteractionReplyOptions } from '../structures/Interaction';
export declare class Context {
    private source;
    readonly user: User;
    readonly guild: Guild | null;
    readonly channel: Channel | null;
    readonly isInteraction: boolean;
    readonly args: string[];
    constructor(source: Message | Interaction, args?: string[]);
    reply(options: string | MessageReplyOptions | InteractionReplyOptions): Promise<void>;
    get author(): User;
    get message(): Message | null;
    get interaction(): Interaction | null;
    get createdAt(): Date;
}
//# sourceMappingURL=Context.d.ts.map