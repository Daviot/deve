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
import { PluginFramework } from '../model/plugin';

export class CLI {
    spinner: any; // ora spinner
    glob: any;
    configArgs: CliStartupConfiguration;
    builder: Builder;
    c: any;
    indexer: Indexer;

    countDown: number;
    files: any[] = [];
    usage: any;
    cliOptions: any[];

    constructor(private fs: FSJetpack, private events: Events, private hooks: Hooks, private config: any) {
        const ora = require('ora');
        this.spinner = ora();
        const { promisify } = require('util');
        this.glob = promisify(require('glob'));

        this.c = require('ansi-colors');
        this.usage = require('command-line-usage');
        this.indexer = new Indexer(this.fs);

        this.cliOptions = [
            {
                name: 'build',
                alias: 'b',
                type: Boolean,
                description: 'Build all files.'
            },
            {
                name: 'watch',
                alias: 'w',
                type: Boolean,
                description: 'Watches for changes and rebuild only effected files.'
            },
            {
                name: 'indexer',
                alias: 'i',
                type: Boolean,
                description: 'Recreates the assets, themes, partials and snippets index for the watch command.'
            },
            {
                name: 'env',
                type: String,
                typeLabel: '{underline production|development}',
                description: 'Which environment config file should be loaded, to override the default config.'
            },
            {
                name: 'help',
                type: Boolean,
                description: 'Print this usage guide.'
            }
        ];
    }
    startup() {
        const templateEngine = require('handlebars');
        // load the partials for the generator to use
        const partials = new Partials(this.fs);
        partials.load();

        const snippets = new Snippets(this.fs);
        snippets.load();
        this.builder = new Builder(templateEngine, this.fs, partials, snippets, this.events, this.hooks, this.config);
    }
    getDate(time: Date) {
        return time.toLocaleDateString();
    }

    loadArguments(): CliStartupConfiguration {
        let config = null;
        // possible options
        try {
            const args = Args(this.cliOptions);

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
        if (config.showHelp) {
            config.useIndexer = false;
            config.useStartupBuild = false;
            config.useWatcher = false;
            console.log(this.cliUsage());
            process.exit();
        }
        // @todo fix order of mode execution build is always first
        // indexer needs the startup build to generate the correct values
        // if(!config.useStartupBuild && config.useIndexer) {
        //     config.useStartupBuild = true;
        // }

        // set environment
        if (this.config.environment != null) {
            this.config.config.environment = config.environment;
        }

        // check if other environment is set and load it to override values from the default config
        const merge = require('deepmerge');
        if (this.config.config.environment != null) {
            const envConfigPath = `config/env.${this.config.config.environment.toLowerCase()}.json`;
            if (this.fs.exists(envConfigPath) == 'file') {
                const envConfig = JSON.parse(this.fs.read(envConfigPath));
                this.config = merge(this.config, envConfig);
            }
        }

        // store the config
        this.configArgs = config;

        // start the cli correct with the new config
        this.startup();

        return config;
    }

    cliUsage() {
        const sections = [
            {
                content: '{italic Static Site Builder} with {italic CMS functionality}'
            },
            {
                header: 'Options',
                optionList: this.cliOptions
            },
            {
                header: 'Examples',
                content: [
                    {
                        desc: 'Build',
                        example: '$ wyvr --build'
                    },
                    {
                        desc: 'Watch',
                        example: '$ wyvr --watch'
                    },
                    {
                        desc: 'Build then index and then watch for changes',
                        example: '$ wyvr -wib'
                    },
                    {
                        desc: 'Change environment to development',
                        example: '$ wyvr --env=development'
                    }
                ]
            }
        ];
        const usage = this.usage(sections);
        return usage;
    }

    async start() {
        //load plugins based on the order in the config file
        const plugins = this.config.plugins;
        const framework = new PluginFramework(this.hooks, this.builder, this.events, this.fs, this.config);
        if (plugins) {
            for (var i = 0, len = plugins.length; i < len; i++) {
                try {
                const pluginName = plugins[i];
                const pluginConstructor = await import(`../../plugins/${pluginName}/index`);
                const plugin = new pluginConstructor.default(framework);
                } catch(e) {
                    console.log(`can't load plugin "${plugins[i]}"`)
                }
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

    async startBuild(ignore: string[], callback: Function) {
        if (this.configArgs.useStartupBuild && callback && typeof callback == 'function') {
            this.builder.prepare();

            this.events.sub('builder:build:done', async (data: any) => {
                this.countDown--;
                if (this.countDown > 0) {
                    this.spinner.text = `${this.countDown + 1} files to process`;
                    this.files.push(data);
                    return;
                }
                this.spinner.succeed('Build complete');
                const resultFiles = await this.hooks.call('builder#after', this.files);
            });
            // this.events.sub('builder:process:increment', () => {
            //     const proc = this.builder.getProcess();
            //     this.spinner.text = `Building ${proc.percent}% ${this.c.dim(`${proc.current}/${proc.amount}`)}`;
            // });
            this.spinner.start('Building');
            let files = await this.glob('content/**/*.json');
            const hookedFiles = await this.hooks.call('builder#before', files);

            if (hookedFiles) {
                files = hookedFiles;
            }

            if (files == null || files.length == 0) {
                //spinner.fail('No files to build');
                return;
            }

            //spinner.succeed('Preparing complete');
            //spinner.start('Building');

            files.map(async (filePath: string) => {
                await callback(this.builder, filePath);
            });
            this.countDown = files.length;

            //this.spinner.succeed('Build complete');
            //const resultFiles = await this.hooks.call('builder#after', files);
            //if (this.configArgs.useWatcher) {
            //    this.events.pub('watcher:start');
            //}
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
