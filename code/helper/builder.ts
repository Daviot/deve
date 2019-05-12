import { Snippets } from './snippets';
import { FSJetpack } from 'fs-jetpack/types';
import { Path } from './path';
import * as Handlebars from 'handlebars';

export class Builder {
    data: any = null;
    template: string = '';
    path: Path;
    defaultTemplate = 'theme/default.hbs';
    constructor(private templateEngine: any, private fs: FSJetpack, private partials:any, private snippets: Snippets, fileData: any, options: any = null) {
        this.data = fileData;
        if (options != null) {
            this.data = Object.assign(options, fileData);
        }
        this.path = new Path();
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

    generate() {
        // load the page template
        let source = this.loadTemplate();

        // register partials
        if(this.data.partials) {
            const partialsKeys = Object.keys(this.data.partials);
            partialsKeys.map((key)=> {
                Handlebars.registerPartial(key, this.partials[this.data.partials[key]]);
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
