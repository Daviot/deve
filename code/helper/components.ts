import { FSJetpack } from 'fs-jetpack/types';
export class Components {
    private store: any = {};
    constructor(private fs: FSJetpack) {}

    load() {
        const files = this.fs.find('components', { matching: '*.hbs' });
        console.log(files);
        files.map((filePath) => {
            // remove first components part of the filepath, for shorter syntax
            const short = filePath.replace('components/', '');
            const content = this.fs.read(filePath);
            this.store[short] = content;
        });
    }

    get(component: string) {
        return this.store[component];
    }

    all() {
        return this.store;
    }

    replace(data: any) {
        console.group(data);
        return data;
    }
}
