import type { Message } from '../structures/Message';
import type { Interaction } from '../structures/Interaction';
import type { User } from '../structures/User';
import type { Guild } from '../structures/Guild';
import type { Channel } from '../structures/Channel';
import type { MessageReplyOptions } from '../structures/Message';
import type { InteractionReplyOptions } from '../structures/Interaction';

export class Context {
  readonly user: User;
  readonly guild: Guild | null;
  readonly channel: Channel | null;
  readonly isInteraction: boolean;
  readonly args: string[];

  constructor(private source: Message | Interaction, args: string[] = []) {
    this.args = args;
    this.isInteraction = !('author' in source);
    this.user = this.isInteraction ? (source as Interaction).user : (source as Message).author;
    this.guild = (source as any).guild || null;
    this.channel = (source as any).channel || null;
  }

  async reply(options: string | MessageReplyOptions | InteractionReplyOptions): Promise<void> {
    if (this.isInteraction) {
      const interaction = this.source as Interaction;
      if (typeof options === 'string') {
        await interaction.reply({ content: options });
      } else {
        await interaction.reply(options as InteractionReplyOptions);
      }
    } else {
      const message = this.source as Message;
      await message.reply(options as MessageReplyOptions);
    }
  }

  get author(): User {
    return this.user;
  }

  get message(): Message | null {
    return !this.isInteraction ? (this.source as Message) : null;
  }

  get interaction(): Interaction | null {
    return this.isInteraction ? (this.source as Interaction) : null;
  }

  get createdAt(): Date {
    return this.isInteraction ? (this.source as Interaction).createdAt : (this.source as Message).createdAt;
  }
}
