import { Events } from './events';
import { Snippets } from './snippets';
import { FSJetpack } from 'fs-jetpack/types';
import { Path } from './path';
import * as Handlebars from 'handlebars';
import { Partials } from './partials';
import { Hooks } from '../model/hooks';

export class Builder {
    template: string = '';
    path: Path;
    defaultTheme = 'default.hbs';
    process = {
        current: 0,
        amount: 0
    };
    constructor(private templateEngine: any, private fs: FSJetpack, private partials: Partials, private snippets: Snippets, private events: Events, private hooks: Hooks, private options: any) {
        this.path = new Path();
        this.events.sub('builder:process:set', (amount: number) => {
            this.process.amount = amount;
        });
        this.events.sub('builder:process:increment', () => {
            this.process.current++;
            if (this.process.current == this.process.amount) {
                setTimeout(() => {
                    this.events.pub('builder:process:complete');
                }, 500);
            }
        });
    }

    prepare() {
        this.events.pub('prepare:start');
        this.events.pub('prepare:complete');
    }

    build(filePath: string) {

        const fileBuildStartTime = new Date().getTime();

        const data = this.getData(filePath);
        console.log('build', filePath, data.destination);
        // build the file
        const generated = this.generate(data);

        // write the json data for debugging
        this.fs.write(`${data.destination}.json`, data);
        // write the generated tempalte
        this.fs.write(data.destination, generated);
        const fileBuildEndTime = new Date().getTime();

        this.events.pub('builder:process:increment', { start: fileBuildStartTime, end: fileBuildEndTime });
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
    loadPage(data: any) {
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
        body = this.compile(body, data);
        return body;
    }

    getData(filePath: any) {
        // make a clone of the default options
        const options = JSON.parse(JSON.stringify(this.options));
        // read file content
        const fileContent = this.fs.read(filePath);
        // parse the content
        let data = JSON.parse(fileContent);
        data.source = filePath;
        if (data.slug == null) {
            data.slug = this.path.toSlug(filePath);
        }
        data.destination = this.path.fromSlug(data.slug);

        // etend with the filedata
        const fileData = Object.assign(options, data);
        return fileData;
    }

    generate(data: any) {
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
        data.body = this.loadPage(data);

        // replace the template with the data
        source = this.compile(source, data);
        // compile the templates from the data itself
        source = this.compile(source, data);

        //@todo apply hooks for plugins

        return source;
    }

    compile(source: string, data: any) {
        let template = this.templateEngine.compile(source);
        let compiledSource = template(data);
        if (data.snippets) {
            return this.snippets.replace(compiledSource, data.snippets);
        }
        return compiledSource;
    }
}
