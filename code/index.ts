import CLI from './helper/cli';

const glob = require('glob');
const fs = require('fs-jetpack');
const ora = require('ora');
const c = require('ansi-colors');

const cli = new CLI();

const spinner = ora();
let time = new Date();
spinner.start(`${c.dim(`[${cli.getDate(time)}] `)}Waiting for changes`);
setTimeout(()=> {
    spinner.info('Changes detected');
    spinner.start('Building');
}, 2000);
setTimeout(()=> {
    spinner.succeed('Builded succeeded');
}, 4000);


