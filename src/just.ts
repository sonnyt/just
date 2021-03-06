#! /usr/bin/env node
import { Command } from 'commander';

import { version } from '../package.json';
import runAction from './commands/run';
import buildAction from './commands/build';
import devAction from './commands/dev';

const program = new Command();

program.name('just');
program.version(version);
program.enablePositionalOptions();

const run = program.command('run');
run.description('runs typescript scripts');
run.argument('<command>', 'command to run');
run.argument('[args...]');
run.optsWithGlobals();
run.passThroughOptions();
run.action(runAction);

const dev = program.command('dev');
dev.description('starts the application in development mode');
dev.argument('[entry]', 'server entry file');
dev.option('-p, --port <port>', 'server port');
dev.option('--type-check', 'enable type checking');
dev.action(devAction);

const build = program.command('build');
build.description('compiles the application for production deployment');
build.argument('[files]', 'files to compile');
build.option('--transpile-only', 'disable type checking');
build.option('--out-dir <outDir>', 'output folder for all emitted files');
build.action(buildAction);

// global options
program.commands.forEach((cmd) => {
  cmd.option('--no-color', 'disable output color');
  cmd.option('--debug', 'log error messages', process.env.JUST_DEBUG ?? false);
  cmd.option(
    '-c, --config <config>',
    'tsconfig.json or jsconfig.json configuration file'
  );
});

program.parse(process.argv);
