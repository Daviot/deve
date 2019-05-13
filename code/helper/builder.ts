import { Events } from './events';
import { Snippets } from './snippets';
import { FSJetpack } from 'fs-jetpack/types';
import { Path } from './path';
import * as Handlebars from 'handlebars';
import { Partials } from './partials';

export class Builder {
    data: any = null;
    template: string = '';
    path: Path;
    defaultTemplate = 'theme/default.hbs';
    process = {
        current: 0,
        amount: 0
    };
    constructor(private templateEngine: any, private fs: FSJetpack, private partials: Partials, private snippets: Snippets, private events: Events, private options: any) {
        this.path = new Path();
        this.events.sub('deve:builder:process:set', (amount:number)=> {
            this.process.amount = amount;
        });
        this.events.sub('deve:builder:process:increment', ()=> {
            this.process.current++;
            if(this.process.current == this.process.amount) {
                setTimeout(() => {
                    this.events.pub('deve:builder:process:complete');
                }, 500);
            }
        });
    }

    prepare() {
        this.events.pub('deve:prepare:start');
        this.events.pub('deve:prepare:complete');
    }

    build(filePath: string) {
        console.log('build', filePath);
        this.events.pub('deve:builder:process:increment');
    }

    getProcess() {
        let process = JSON.parse(JSON.stringify(this.process));
        process.percent = this.process.current / (this.process.amount > 0 ? this.process.amount : 1) * 100;
        return process;
    }

    validate() {
        return this.data != null;
    }

    loadTemplate() {
        //console.log('');
        if (this.data.page != null) {
            const path = this.fs.path(this.path.dir(this.data.source), this.data.page);
            if(!this.fs.exists(path)) {
                console.error(`template "${this.data.page}" could not be found for "${this.data.source}", fallback to "${this.defaultTemplate}"`);
                return this.fs.read(this.defaultTemplate);
            }
            let html = this.fs.read(path);

            //console.log(this.data.page);
            //console.log(path);
            //console.log(html);
            return html;
        }
    }

    generate(fileData: any) {
        const options = JSON.parse(JSON.stringify(this.options));

        this.data = Object.assign(options, fileData);
        // load the page template
        let source = this.loadTemplate();

        // register partials
        if(this.data.partials) {
            const partialsKeys = Object.keys(this.data.partials);
            partialsKeys.map((key)=> {
                Handlebars.registerPartial(key, this.partials.all()[this.data.partials[key]]);
            });
        }

        // replace the template with the data
        source = this.compile(source);
        // compile the templates from the dat itself
        source = this.compile(source);

        return source;
    }

    compile(source: string) {
        let template = this.templateEngine.compile(source);
        let compiledSource = template(this.data);
        if(this.data.snippets) {
            return this.snippets.replace(compiledSource, this.data.snippets);
        }
        return compiledSource;
    }
}
