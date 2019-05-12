import { Partials } from './helper/partials';
import { CLI } from './helper/cli';
import { Builder } from './helper/builder';
import * as fs from 'fs-jetpack';
import { InspectResult } from 'fs-jetpack/types';
import { Path } from './helper/path';

const { promisify } = require('util');
const glob = promisify(require('glob'));
const ora = require('ora');
const c = require('ansi-colors');
const templateEngine = require('handlebars');

const cli = new CLI();

const path = new Path();

const spinner = ora();
let time = new Date();
// spinner.start(`${c.dim(`[${cli.getDate(time)}] `)}Waiting for changes`);
// setTimeout(()=> {
//     spinner.info('Changes detected');
//     spinner.start('Building');
// }, 2000);
// setTimeout(()=> {
//     spinner.succeed('Builded succeeded');
// }, 4000);

spinner.start('Preparing');
let config: any = null;
const configPath = 'content/config.json';
const buildStartTime = new Date().getTime();
if (fs.exists(configPath) == 'file') {
    config = JSON.parse(fs.read(configPath));
}
glob('content/**/*.json')
    .then((files: any) => {
        if(files == null || files.length == 0) {
            spinner.fail('No files to build');
            return;
        }


        //console.log(files);
        // load the components for the generator to use
        const components = new Partials(fs);
        components.load();

        // remove system files
        const pureFiles = files.filter((filePath: string) => filePath != 'content/config.json');
        let filesProgress = 1;

        spinner.succeed('Preparing complete');
        spinner.start('Building');
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
            const builder = new Builder(templateEngine, fs, components.all(), fileData, config);
            const generated = builder.generate();
            console.log(' ')
            console.log(fileData)
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
        spinner.fail('Build failed');
        console.error(error);
    });
function final(amountOfFiles: number) {
    const buildEndTime = new Date().getTime();
    const buildTime = (buildEndTime - buildStartTime) / 1000;
    spinner.succeed(
        `Build complete in ${c.green(`${buildTime}s`)} for ${c.green(amountOfFiles)} ${amountOfFiles == 1 ? 'file' : 'files'} ${c.dim(`${buildTime / amountOfFiles}s/file`)}`
    );
}
