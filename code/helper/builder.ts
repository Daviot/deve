import { FSJetpack } from 'fs-jetpack/types';
import { Path } from './path';
import * as Handlebars from 'handlebars';

export class Builder {
    data: any = null;
    template: string = '';
    path: Path;
    defaultTemplate = 'theme/default.hbs';
    constructor(private templateEngine: any, private fs: FSJetpack, private partials:any, fileData: any, options: any = null) {
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
        const templateSource = this.loadTemplate();

        if(this.data.partials) {

            const partialsKeys = Object.keys(this.data.partials);

            partialsKeys.map((key)=> {
                // console.log(key)
                // console.log(this.components[this.data.components[key]])
                // console.log('')
                Handlebars.registerPartial(key, this.partials[this.data.partials[key]]);
            });
        }

        const template = this.templateEngine.compile(templateSource);
        const contentTemplate = this.templateEngine.compile(template(this.data));

        return contentTemplate(this.data);
    }
}
