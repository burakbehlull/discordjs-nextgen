export class Cooldown {
  private readonly seconds: number;
  private readonly map: Map<string, number> = new Map();

  constructor(seconds: number) {
    this.seconds = seconds;
  }

  isOnCooldown(userId: string): boolean {
    const expires = this.map.get(userId);
    if (!expires) return false;
    if (Date.now() >= expires) {
      this.map.delete(userId);
      return false;
    }
    return true;
  }

  remaining(userId: string): number {
    const expires = this.map.get(userId);
    if (!expires) return 0;
    return Math.ceil((expires - Date.now()) / 1000);
  }

  set(userId: string): void {
    this.map.set(userId, Date.now() + this.seconds * 1000);
  }

  clear(userId: string): void {
    this.map.delete(userId);
  }
}
