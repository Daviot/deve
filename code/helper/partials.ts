import { FSJetpack } from 'fs-jetpack/types';
export class Partials {
    private store: any = {};
    constructor(private fs: FSJetpack) {}

    load() {
        const files = this.fs.find('partials', { matching: '*.hbs' });
        files.map((filePath) => {
            // remove first partials part of the filepath, for shorter syntax
            const short = filePath.replace('partials/', '');
            const content = this.fs.read(filePath);
            this.store[short] = content;
        });
    }

    get(partial: string) {
        return this.store[partial];
    }

    all() {
        return this.store;
    }

    replace(data: any) {
        console.log(data);
        return data;
    }
}
