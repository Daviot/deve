import { FSJetpack } from 'fs-jetpack/types';
import { Path } from './path';

export class Builder {
    data: any = null;
    template: string = '';
    path: Path;
    defaultTemplate = 'theme/default.hbs';
    constructor(private templateEngine: any, private fs: FSJetpack, fileData: any, options: any = null) {
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
        console.log('');
        if (this.data.page != null) {
            const path = this.fs.path(this.path.dir(this.data.source), this.data.page);
            if(!this.fs.exists(path)) {
                console.error(`template "${this.data.page}" could not be found for "${this.data.source}", fallback to "${this.defaultTemplate}"`);
                return this.fs.read(this.defaultTemplate);
            }
            let html = this.fs.read(path);

            console.log(this.data.page);
            console.log(path);
            console.log(html);
            return html;
        }
    }

    generate() {
        const templateSource = this.loadTemplate();

        const template = this.templateEngine.compile(templateSource);

        return template(this.data);
    }
}
