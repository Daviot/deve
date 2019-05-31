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
import { Logger } from './helper/logger';

const { promisify } = require('util');
const c = require('ansi-colors');

const logger = new Logger(fs, null); //@todo add buildId as second parameter to generate different logs

const events = new Events(logger);

const path = new Path();

const hooks = new Hooks(logger);

// generate uniq build id to make apply them to build
const buildId = Math.floor((1 + Math.random()) * 0x100000);


const logo = `${c.red.dim('<')}${c.red('wyvr')}${c.red.dim('>')}`;
console.log(logo);
console.log(c.dim('build'), buildId);
console.log(c.dim('log'), logger.getPath());
logger.info('wyvr', `build ${buildId}`);

// load the config
let config: any = null;
const configPath = 'config/env.json';

if (!fs.exists(configPath)) {
    logger.error('wyvr', 'missing config');
    process.exit();
}
config = JSON.parse(fs.read(configPath));
config.build = buildId;

const cli = new CLI(fs, events, hooks, logger, config);

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
logger.info('wyvr', 'ignored', ignore);

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
    logger.error('wyvr', 'no config arguments available');
    process.exit();
}

// startup the cli
cli.start();
