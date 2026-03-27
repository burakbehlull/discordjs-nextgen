import type { Message } from '../structures/Message.js';
import type { Interaction } from '../structures/Interaction.js';
import type { User } from '../structures/User.js';
import type { Guild } from '../structures/Guild.js';
import type { Channel } from '../structures/Channel.js';
import type { MessageReplyOptions } from '../structures/Message.js';
import type { InteractionReplyOptions } from '../structures/Interaction.js';
import type { Modal } from '../builders/ModalBuilder.js';
import type { App } from '../client/App.js';

export class Context {
  readonly user: User;
  readonly guild: Guild | null;
  readonly channel: Channel | null;
  readonly isInteraction: boolean;
  readonly args: string[];
  public app?: App;

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

  async deferReply(ephemeral = false): Promise<void> {
    if (!this.isInteraction) {
      throw new Error('deferReply sadece interaction contextinde kullanilabilir.');
    }

    await (this.source as Interaction).deferReply(ephemeral);
  }

  async followUp(options: string | MessageReplyOptions | InteractionReplyOptions): Promise<void> {
    if (this.isInteraction) {
      await (this.source as Interaction).followUp(options as string | InteractionReplyOptions);
      return;
    }

    await (this.source as Message).reply(options as string | MessageReplyOptions);
  }

  async editReply(options: string | InteractionReplyOptions): Promise<void> {
    if (!this.isInteraction) {
      throw new Error('editReply sadece interaction contextinde kullanilabilir.');
    }

    await (this.source as Interaction).editReply(options);
  }

  async showModal(modal: Modal | Record<string, any> | string): Promise<void> {
    if (!this.isInteraction) {
      throw new Error('Modallar sadece interaction contextinde (Buton, Slash, Modal vb.) açılabilir.');
    }

    const interaction = this.source as Interaction;
    if (typeof modal === 'string') {
      if (!this.app) {
        throw new Error('app nesnesi Context icerisinde bulunamadi. ID ile modal göstermek icin app.modal() kaydi gereklidir.');
      }
      const registeredModal = this.app.modals.get(modal);
      if (!registeredModal) {
        throw new Error(`'${modal}' ID'sine sahip bir modal bulunamadı.`);
      }
      await interaction.showModal(registeredModal);
    } else {
      await interaction.showModal(modal);
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

  get commandName(): string | null {
    return this.interaction?.commandName ?? null;
  }

  get customId(): string | null {
    return this.interaction?.customId ?? null;
  }

  get isCommand(): boolean {
    if (this.isInteraction) {
      return this.interaction?.isCommand || false;
    }
    
    // Prefix command check
    const message = this.source as any;
    if (!message._usedPrefix) return false;
    return true;
  }

  get isModalSubmit(): boolean {
    return this.interaction?.isModalSubmit ?? false;
  }

  get values(): Record<string, string> | null {
    return this.interaction?.values ?? null;
  }

  get memberPermissions(): string | null {
    return this.isInteraction
      ? (this.source as Interaction).memberPermissions
      : (this.source as Message).memberPermissions;
  }
}
