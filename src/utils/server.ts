import nodemon from 'nodemon';

export default class Server {
  private instace: typeof nodemon;
  private entry: string;

  constructor(entry: string) {
    this.entry = entry;
  }

  private setup() {
    this.instace = nodemon({
      cwd: process.cwd(),
      colours: true,
      watch: false as any,
      exec: `node ${this.entry}`
    });

    return this.instace;
  }

  start() {
    if (this.instace) {
      return this.restart();
    }

    console.log('[Just] Starting server...');
    return this.setup();
  }

  restart() {
    console.log('[Just] Restarting server...');
    return this.instace.restart();
  }
}