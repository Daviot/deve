import { Logger } from './logger';
import { Events } from './events';
import { Snippets } from './snippets';
import { FSJetpack } from 'fs-jetpack/types';
import { Path } from './path';
import * as Handlebars from 'handlebars';
import { Partials } from './partials';
import { Hooks } from '../model/hooks';
import { Assets } from './assets';

export class Builder {
    template: string = '';
    path: Path;
    defaultTheme = 'default.hbs';
    process = {
        current: 0,
        amount: 0
    };
    merge = require('deepmerge');
    constructor(
        private templateEngine: any,
        private fs: FSJetpack,
        private partials: Partials,
        private snippets: Snippets,
        private events: Events,
        private hooks: Hooks,
        private assets: Assets,
        private logger: Logger,
        private options: any
    ) {
        this.path = new Path();

        /*this.events.sub('builder:process:set', (amount: number) => {
            this.process.amount = amount;
        });
        this.events.sub('builder:process:increment', () => {
            this.process.current++;
            if (this.process.current == this.process.amount) {
                setTimeout(() => {
                    this.events.pub('builder:process:complete');
                }, 500);
            }
        });*/
    }

    prepare() {
        this.events.pub('prepare:start');
        this.events.pub('prepare:complete');
    }

    async build(filePath: string) {
        const hookedFilePath = await this.hooks.call('builder:build#before', filePath);

        if (hookedFilePath) {
            filePath = hookedFilePath;
        }

        if (!this.fs.exists(filePath)) {
            return null;
        }
        const fileBuildStartTime = new Date().getTime();

        let data = await this.getData(filePath);

        if (data == null) {
            return null;
        }
        //console.log('build', filePath, data.destination);
        // replace and handle assets
        data = await this.assets.load(data);

        // build the file
        const generated = await this.generate(data);

        // write the json data for debugging
        if (this.options.config.generatePublicJson) {
            this.fs.write(`${data.destination}.json`, data);
        }
        // write the generated tempalte
        this.fs.write(data.destination, generated);
        const fileBuildEndTime = new Date().getTime();
        data.buildTime = fileBuildEndTime - fileBuildStartTime;
        this.logger.info(this, `"${filePath}" build time ${data.buildTime}`);

        const hookedData = await this.hooks.call('builder:build#after', data);

        if (hookedData) {
            data = hookedData;
        }
        this.events.pub('builder:build:done', data);

        return data;
        //this.events.pub('builder:process:increment', { start: fileBuildStartTime, end: fileBuildEndTime });
    }

    getProcess() {
        let process = JSON.parse(JSON.stringify(this.process));
        process.percent = (this.process.current / (this.process.amount > 0 ? this.process.amount : 1)) * 100;
        return process;
    }

    validate(data: any) {
        return data != null;
    }

    loadTheme(data: any) {
        if (data == null) {
            return null;
        }

        // when no data is set return default
        if (data.theme == null) {
            return this.fs.read(this.defaultTheme);
        }
        const path = this.fs.path(`theme/${data.theme}`);
        if (!this.fs.exists(path)) {
            console.error(`theme "${data.theme}" could not be found for "${data.source}", fallback to "${this.defaultTheme}"`);
            return this.fs.read(this.defaultTheme);
        }
        let html = this.fs.read(path);

        return html;
    }
    async loadPage(data: any) {
        if (data == null) {
            return null;
        }

        // when no data is set return default
        if (data.page == null) {
            return data.body;
        }
        const path = this.fs.path(`${this.path.dir(data.source)}/${data.page}`);
        if (!this.fs.exists(path)) {
            console.error(`page "${data.page}" could not be found for "${data.source}"`);
            return data.body;
        }
        let body = this.fs.read(path);
        body = await this.compile(body, data);
        return body;
    }

    async getData(filePath: any) {
        // make a clone of the default options
        let options = JSON.parse(JSON.stringify(this.options));
        const hookedOptions = await this.hooks.call('builder:get-data#before', options);
        if (hookedOptions) {
            options = hookedOptions;
        }
        // read file content
        const fileContent = this.fs.read(filePath);
        const stats = this.fs.inspect(filePath, {
            times: true
        });
        // parse the content
        if (fileContent == null) {
            return null;
        }
        let data = JSON.parse(fileContent);
        data.lastModified = new Date(stats.modifyTime);
        data.source = filePath;
        if (data.slug == null) {
            data.slug = this.path.toSlug(filePath);
        }
        // force that slugs start with a /
        if (data.slug.indexOf('/') != 0) {
            data.slug = `/${data.slug}`;
        }
        data.destination = this.path.fromSlug(data.slug);

        // extend with the filedata
        const fileData = this.merge(options, data);

        // create hook for plugins
        const hookedData = await this.hooks.call('builder:get-data#after', fileData);

        if (hookedData) {
            return hookedData;
        }
        return fileData;
    }

    async generate(data: any) {
        const hookedData = await this.hooks.call('builder:generate#before', data);

        if (hookedData) {
            data = hookedData;
        }
        // load the page template
        let source = this.loadTheme(data);

        // register partials
        if (data.partials) {
            const partialsKeys = Object.keys(data.partials);
            partialsKeys.map((key) => {
                Handlebars.registerPartial(key, this.partials.all()[data.partials[key]]);
            });
        }

        // check if the file has a page file defined to extend the body
        data.body = await this.loadPage(data);

        // replace the template with the data
        source = await this.compile(source, data);
        // compile the templates from the data itself
        source = await this.compile(source, data);

        // create hook for plugins
        const hookedSource = await this.hooks.call('builder:generate#after', source);

        if (hookedSource) {
            source = hookedSource;
        }
        return source;
    }

    async compile(source: string, data: any) {
        let template = this.templateEngine.compile(source);
        let compiledSource = template(data);
        if (data.snippets) {
            compiledSource = this.snippets.replace(compiledSource, data.snippets, data.source);
        }
        if (data.assets) {
            compiledSource = await this.assets.replace(compiledSource, data.assets);
        }
        return compiledSource;
    }
}
