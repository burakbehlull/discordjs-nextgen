const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const GRAY = '\x1b[90m';

function timestamp(): string {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const s = now.getSeconds().toString().padStart(2, '0');
  return `${GRAY}[${h}:${m}:${s}]${RESET}`;
}

export class Logger {
  static info(message: string): void {
    console.log(`${timestamp()} ${BOLD}${CYAN}[INFO]${RESET} ${message}`);
  }

  static warn(message: string): void {
    console.warn(`${timestamp()} ${BOLD}${YELLOW}[WARN]${RESET} ${message}`);
  }

  static error(message: string): void {
    console.error(`${timestamp()} ${BOLD}${RED}[ERROR]${RESET} ${message}`);
  }

  static success(message: string): void {
    console.log(`${timestamp()} ${BOLD}${GREEN}[OK]${RESET} ${message}`);
  }

  static debug(message: string): void {
    if (process.env.DEBUG) {
      console.log(`${timestamp()} ${GRAY}[DEBUG]${RESET} ${message}`);
    }
  }
}
