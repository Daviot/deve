import { Builder } from './builder';
import { FSJetpack } from 'fs-jetpack/types';
import { Events } from './events';
import { CliStartupConfiguration } from '../model/cli';
import * as Chokidar from 'chokidar';
import * as Args from 'command-line-args';
import * as Minimatch from 'minimatch';
import { Partials } from './partials';
import { Snippets } from './snippets';

export class CLI {
    spinner: any; // ora spinner
    glob: any;
    configArgs: CliStartupConfiguration;
    builder: Builder;
    c: any;
    constructor(private fs: FSJetpack, private events: Events, private configFile: any) {
        const ora = require('ora');
        this.spinner = ora();
        const { promisify } = require('util');
        this.glob = promisify(require('glob'));

        const templateEngine = require('handlebars');
        // load the partials for the generator to use
        const partials = new Partials(this.fs);
        partials.load();

        const snippets = new Snippets(this.fs);
        snippets.load();

        this.builder = new Builder(templateEngine, fs, partials, snippets, this.events, this.configFile);
        this.c = require('ansi-colors');
    }
    getDate(time: Date) {
        return time.toLocaleDateString();
    }

    loadArguments(): CliStartupConfiguration {
        // possible options
        const args = Args([
            {
                name: 'watch',
                alias: 'w',
                type: Boolean
            },
            {
                name: 'build',
                alias: 'b',
                type: Boolean
            }
        ]);
        let config = new CliStartupConfiguration(args);
        // fallback when nothing is active start build
        if (!config.useStartupBuild && !config.useWatcher) {
            config.useStartupBuild = true;
        }
        // store the config
        this.configArgs = config;
        return config;
    }

    startWatcher(ignore: string[], callback: Function) {
        if (this.configArgs.useWatcher && callback && typeof callback == 'function') {
            this.builder.prepare();
            const watcher = Chokidar.watch('.', {
                ignored: ignore,
                ignoreInitial: true
            });
            this.spinner.start('Waiting for changes');
            watcher.on('all', async (event, file: string) => {
                let isWatching = ignore.find((ignore: string) => Minimatch(file, ignore)) == null;
                // @todo for plugin/snippets the needed pages must be found
                // @todo for theme the needed pages must be found
                // @todo for plugins the whole site or nothing should be generated

                // @todo for content easy
                if (isWatching) {
                    isWatching = Minimatch(file, 'content/*');
                    if (isWatching) {
                        this.spinner.succeed(`${event} detected for ${file}`);
                        await callback(this.builder, file);
                        this.spinner.start('Waiting for changes');
                    }
                }
            });
        }
    }

    startBuild(ignore: string[], callback: Function) {
        if (this.configArgs.useStartupBuild && callback && typeof callback == 'function') {
            this.builder.prepare();
            // when ready try to start watcher, when needed
            this.events.sub('deve:builder:process:complete', ()=> {
                this.spinner.succeed('Build complete');
                if(this.configArgs.useWatcher) {
                    this.events.pub('deve:watcher:start');
                }
            });
            this.events.sub('deve:builder:process:increment', ()=> {
                const proc = this.builder.getProcess();
                this.spinner.text = `Building ${proc.percent}% ${this.c.dim(`${proc.current}/${proc.amount}`)}`;
            });
            this.spinner.start('Building');
            this.glob('content/**/*.json')
                .then((files: any) => {
                    if (files == null || files.length == 0) {
                        //spinner.fail('No files to build');
                        return;
                    }

                    // remove system files
                    const pureFiles = files.filter((filePath: string) => filePath != 'content/config.json');

                    //spinner.succeed('Preparing complete');
                    //spinner.start('Building');
                    this.events.pub('deve:builder:process:set', pureFiles.length);

                    pureFiles.map((filePath: string) => {
                        callback(this.builder, filePath);
                    });
                })
                .catch((error: any) => {
                    //spinner.fail('Build failed');
                    console.error(error);
                });
        }
    }
}
