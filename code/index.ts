import { Hooks } from './model/hooks';
import { Partials } from './helper/partials';
import { Snippets } from './helper/snippets';
import { CLI } from './helper/cli';
import { Builder } from './helper/builder';
import * as fs from 'fs-jetpack';
import { InspectResult } from 'fs-jetpack/types';
import { Path } from './helper/path';
import { Events } from './helper/events';
import * as chokidar from 'chokidar';

const { promisify } = require('util');
const glob = promisify(require('glob'));
const ora = require('ora');
const c = require('ansi-colors');

const events = new Events();

const path = new Path();

const hooks = new Hooks();

const spinner = ora();
let time = new Date();

const logo = `${c.red.dim('<')}${c.red('wyvr')}${c.red.dim('>')}`;
console.log(logo);

// load the config
let config: any = null;
const configPath = 'config/config.json';
const buildStartTime = new Date().getTime();
if (fs.exists(configPath) == 'file') {
    config = JSON.parse(fs.read(configPath));
}

const cli = new CLI(fs, events, hooks, config);

// load the arguments from the commandline
const configArgs = cli.loadArguments();
// spinner.start(`${c.dim(`[${cli.getDate(time)}] `)}Waiting for changes`);
// setTimeout(()=> {
//     spinner.info('Changes detected');
//     spinner.start('Building');
// }, 2000);
// setTimeout(()=> {
//     spinner.succeed('Builded succeeded');
// }, 4000);

// read values from gitignore
let ignore = fs
    .read('.gitignore')
    .split('\n')
    .filter((entry) => entry != '');
// add git for ignoring
ignore.push('.git');

events.pub('prepare:end');

// init startupbuild
events.sub('build:start', async () => {
    await cli.startBuild(ignore, async (builder: Builder, filePath: string) => {
        await builder.build(filePath);
    });
});
// init watcher
events.sub('watcher:start', async () => {
    await cli.startWatcher(ignore, async (builder: Builder, filePath: string) => {
        await builder.build(filePath);
    });
});
// init indexer
events.sub('indexer:start', async () => {
    await cli.startIndexer();
});

//console.log('configArgs', configArgs)
if (configArgs == null) {
    process.exit();
}

// startup the cli
cli.start();
