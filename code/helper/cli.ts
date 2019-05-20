import { Indexer } from './indexer';
import { Builder } from './builder';
import { FSJetpack } from 'fs-jetpack/types';
import { Events } from './events';
import { CliStartupConfiguration } from '../model/cli';
import * as Chokidar from 'chokidar';
import * as Args from 'command-line-args';
import * as Minimatch from 'minimatch';
import { Partials } from './partials';
import { Snippets } from './snippets';
import { Hooks } from '../model/hooks';

export class CLI {
    spinner: any; // ora spinner
    glob: any;
    configArgs: CliStartupConfiguration;
    builder: Builder;
    c: any;
    indexer: Indexer;
    constructor(private fs: FSJetpack, private events: Events, private hooks: Hooks, private config: any) {
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

        this.builder = new Builder(templateEngine, fs, partials, snippets, this.events, this.hooks, this.config);
        this.c = require('ansi-colors');
        this.indexer = new Indexer(fs);
    }
    getDate(time: Date) {
        return time.toLocaleDateString();
    }

    loadArguments(): CliStartupConfiguration {
        let config = null;
        // possible options
        try {
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
                },
                {
                    name: 'indexer',
                    alias: 'i',
                    type: Boolean
                }
            ]);
            config = new CliStartupConfiguration(args);
        } catch (ex) {
            if (ex) {
                if (ex.optionName != null) {
                    console.error(`unknown option "${ex.optionName}"`);
                }
            }
            return;
        }
        // fallback when nothing is active start build
        if (!config.useStartupBuild && !config.useWatcher && !config.useIndexer) {
            config.useStartupBuild = true;
        }
        // @todo fix order of mode execution build is always first
        // indexer needs the startup build to generate the correct values
        // if(!config.useStartupBuild && config.useIndexer) {
        //     config.useStartupBuild = true;
        // }
        // store the config
        this.configArgs = config;
        return config;
    }

    async start() {
        //load plugins based on the order in the config file
        const plugins = this.config.plugins;
        if (plugins) {
            for (var i = 0, len = plugins.length; i < len; i++) {
                const pluginName = plugins[i];
                const pluginConstructor = await import(`../../plugins/${pluginName}/index`);
                const plugin = new pluginConstructor.default(this.hooks);
            }
        }

        if (this.configArgs.useIndexer) {
            this.events.pub('indexer:start');
        }
        if (this.configArgs.useStartupBuild) {
            this.events.pub('build:start');
        }
        if (!this.configArgs.useStartupBuild && this.configArgs.useWatcher) {
            this.events.pub('watcher:start');
        }
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
                console.log('watch', file, event);
                const isNotIgnored = ignore.find((ignore: string) => Minimatch(file, ignore)) == null;

                if (isNotIgnored) {
                    this.spinner.succeed(`${event} detected for ${file}`);
                    // watch themes, pages, partials and snippets
                    if (Minimatch(file, 'theme/**/*') || Minimatch(file, 'partials/**/*') || Minimatch(file, 'snippets/**/*') || Minimatch(file, 'content/**/*.hbs')) {
                        const indexes = this.indexer.getIndex(file);
                        // build all files which are depending on this theme
                        indexes.map(async (file: string) => {
                            await callback(this.builder, file);
                        });
                    }
                    // watch content
                    if (Minimatch(file, 'content/**/*.json')) {
                        await callback(this.builder, file);
                    }
                    this.spinner.start('Waiting for changes');
                }
            });
        }
    }

    startBuild(ignore: string[], callback: Function) {
        if (this.configArgs.useStartupBuild && callback && typeof callback == 'function') {
            this.builder.prepare();
            // when ready try to start watcher, when needed
            this.events.sub('builder:process:complete', () => {
                this.spinner.succeed('Build complete');
                if (this.configArgs.useWatcher) {
                    this.events.pub('watcher:start');
                }
            });
            this.events.sub('builder:process:increment', () => {
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

                    //spinner.succeed('Preparing complete');
                    //spinner.start('Building');
                    this.events.pub('builder:process:set', files.length);

                    files.map(async (filePath: string) => {
                        await callback(this.builder, filePath);
                    });
                })
                .catch((error: any) => {
                    //spinner.fail('Build failed');
                    console.error(error);
                });
        }
    }

    async startIndexer() {
        this.spinner.start('Indexing');
        const files = await this.glob('content/**/*.json');

        if (files == null || files.length == 0) {
            //spinner.fail('No files to build');
            return;
        }

        files.map(async (filePath: string) => {
            await this.indexer.generateIndexesOfFile(filePath, this.builder);
        });
        this.spinner.succeed('Indexing complete');
    }
}
