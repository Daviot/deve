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

const logo = `${c.red.dim('<')}${c.red('deve')}${c.red.dim('>')}`;
console.log(logo);

// load the config
let config: any = null;
const configPath = 'content/config.json';
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

if (configArgs.useIndexer) {
    events.pub('indexer:start');
}
if (configArgs.useStartupBuild) {
    events.pub('build:start');
}
if (!configArgs.useStartupBuild && configArgs.useWatcher) {
    events.pub('watcher:start');
}

/*
const fileBuildStartTime = new Date().getTime();
            //console.log('');
            const fileContent = this.fs.read(filePath);
            let fileData = JSON.parse(fileContent);
            fileData.source = filePath;
            if (fileData.slug == null) {
                fileData.slug = path.dir(filePath);
            }
            fileData.destination = path.fromSlug(fileData.slug);

            //fileData = components.replace(fileData);
            //console.log(fileData.destination);
            //console.log(fs.cwd());
            const builder = new Builder(templateEngine, fs, partials.all(), snippets, fileData, config);
            const generated = builder.generate();
            //console.log(' ')
            //console.log(fileData)
            // write the json data for debugging
            fs.write(`${fileData.destination}.json`, fileData);
            // write the generated tempalte
            fs.write(fileData.destination, generated);
            const fileBuildEndTime = new Date().getTime();
            spinner.text = `Built file ${filesProgress} of ${pureFiles.length} in ${c.green(`${(fileBuildEndTime - fileBuildStartTime) / 1000}s`)}`;
            if (filesProgress++ == pureFiles.length) {

            }
*/

/*
glob('content/**\/*.json')
    .then((files: any) => {
        if(files == null || files.length == 0) {
            //spinner.fail('No files to build');
            return;
        }


        //console.log(files);
        // load the partials for the generator to use
        const partials = new Partials(fs);
        partials.load();

        const snippets = new Snippets(fs);
        snippets.load();

        // remove system files
        const pureFiles = files.filter((filePath: string) => filePath != 'content/config.json');
        let filesProgress = 1;
        events.pub('prepare:complete');

        //spinner.succeed('Preparing complete');
        //spinner.start('Building');
        pureFiles.map((filePath: string) => {
            const fileBuildStartTime = new Date().getTime();
            //console.log('');
            const fileContent = fs.read(filePath);
            let fileData = JSON.parse(fileContent);
            fileData.source = filePath;
            if (fileData.slug == null) {
                fileData.slug = path.dir(filePath);
            }
            fileData.destination = path.fromSlug(fileData.slug);

            //fileData = components.replace(fileData);
            //console.log(fileData.destination);
            //console.log(fs.cwd());
            const builder = new Builder(templateEngine, fs, partials.all(), snippets, fileData, config);
            const generated = builder.generate();
            //console.log(' ')
            //console.log(fileData)
            // write the json data for debugging
            fs.write(`${fileData.destination}.json`, fileData);
            // write the generated tempalte
            fs.write(fileData.destination, generated);
            const fileBuildEndTime = new Date().getTime();
            spinner.text = `Built file ${filesProgress} of ${pureFiles.length} in ${c.green(`${(fileBuildEndTime - fileBuildStartTime) / 1000}s`)}`;
            if (filesProgress++ == pureFiles.length) {
                final(pureFiles.length);
            }
        });
    })
    .catch((error: any) => {
        //spinner.fail('Build failed');
        console.error(error);
    });
function final(amountOfFiles: number) {
    const buildEndTime = new Date().getTime();
    const buildTime = (buildEndTime - buildStartTime) / 1000;
    spinner.succeed(
        `Build complete in ${c.green(`${buildTime}s`)} for ${c.green(amountOfFiles)} ${amountOfFiles == 1 ? 'file' : 'files'} ${c.dim(`${buildTime / amountOfFiles}s/file`)}`
    );
}
*/
