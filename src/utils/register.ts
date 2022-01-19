import type { program as Program } from 'commander';

const COMMANDS = ['build', 'serve'];

export default async function(program: typeof Program) {
  for await (const command of COMMANDS) {
    const cmd = await import(`${__dirname}/../commands/${command}`);
    await cmd.default(program);
  }
}