import { CLI } from './helper/cli';
import { Builder } from './helper/builder';
import * as fs from 'fs-jetpack';
import { InspectResult } from "fs-jetpack/types";
import {Path} from './helper/path';

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

spinner.start('Building');
let config: any = null;
const configPath = 'content/config.json';
if (fs.exists(configPath) == 'file') {
    config = JSON.parse(fs.read(configPath));
}
glob('content/**/*.json')
    .then((files: any) => {
        console.log(files);
        files
            .filter((filePath: string) => filePath != 'content/config.json')
            .map((filePath: string) => {
                console.log('');
                const fileContent = fs.read(filePath);
                let fileData = JSON.parse(fileContent);
                fileData.source = filePath;
                if(fileData.slug == null) {
                    fileData.slug = path.dir(filePath);
                }
                fileData.destination = path.fromSlug(fileData.slug);
                console.log(fileData.destination);
                //console.log(fs.cwd());
                const builder = new Builder(templateEngine, fs, fileData, config);
                const generated = builder.generate();
                console.log('result:');
                console.log(generated);
                fs.writeAsync(fileData.destination, generated).then(()=> {
                    console.log('finished')
                });
            });
        spinner.succeed('Build complete');
    })
    .catch((error: any) => {
        spinner.fail('Build failed');
        console.error(error);
    });
