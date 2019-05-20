import { FSJetpack } from 'fs-jetpack/types';
export class Snippets {
    private store: any = {};
    constructor(private fs: FSJetpack) {}

    /**
     * Loads all available snippets from the snippet directory
     */
    load() {
        const files = this.fs.find('snippets', { matching: '*.hbs' });
        files.map((filePath) => {
            // remove first snippets part of the filepath, for shorter syntax
            const short = filePath.replace('snippets/', '');
            const content = this.fs.read(filePath);
            this.store[short] = content;
        });
    }

    /**
     * Returns the content for a snippet path
     * @param snippet string with the path to the snippet
     */
    get(snippet: string, path: string) {
        if(!this.store.hasOwnProperty(snippet)) {
            console.error(`unknown snippet "${snippet}" in "${path}"`);
            return '';
        }
        return this.store[snippet];
    }

    /**
     * Return the values in the store
     */
    all() {
        return this.store;
    }

    /**
     * Replaces the snippets in the given source
     * @param source html source code where snippets should be replaced
     * @param snippets object with key value pair that should be replaced, where key is indicator in the source and the value is the path to the snippet
     */
    replace(source: string, snippets: any, path: string) {
        if (snippets) {
            const keys = Object.keys(snippets);
            keys.map((key) => {
                source = source.replace(new RegExp('(\\[\\[' + key + '\\]\\])', 'gi'), this.get(snippets[key], path));
            });
        }
        return source;
    }
}
