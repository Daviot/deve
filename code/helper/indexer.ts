import { FSJetpack } from 'fs-jetpack/types';

export class Indexer {
    constructor(private fs:FSJetpack) {}

    getIndex(filePath: string) {
        const indexPath = this.fs.path('indexes', filePath.replace(/\.hbs$/i, '.txt'));
        console.log('indexfile', indexPath)
        // index was found return the files
        if(this.fs.exists(indexPath)) {
            console.log('found index');
            const content = this.fs.read(indexPath);
            return content.split('\n');
        }
        // index file was not found create it, after searching for the needed files
        // read file to find the indexes
        let files = this.fs.find('public', { matching: ['*.html.json'] });
        // search for the content in the file and return the original source
        files = files.map((file)=> {
            const content = this.fs.read(file);
            const found = content.indexOf(`"${filePath}"`) > -1;
            if(!found) {
                return null;
            }
            const data = JSON.parse(content);
            return data.source;
        }).filter((file)=> file != null);

        console.log(files);
        this.setIndex(indexPath, files);
    }
    setIndex(filePath: string, files: string[]) {
        // read file to find the indexes
        this.fs.write(filePath, files.join('\n'));
    }
}
