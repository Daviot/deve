import { Path } from './path';
import { Builder } from './builder';
import { FSJetpack } from 'fs-jetpack/types';

export class Indexer {
    path: Path;
    constructor(private fs: FSJetpack) {
        this.path = new Path();
    }

    getIndex(filePath: string) {
        const indexPath = this.getIndexFilePath(filePath);
        console.log('indexfile', indexPath);
        // index was found return the files
        if (this.fs.exists(indexPath)) {
            console.log('found index');
            const content = this.fs.read(indexPath);
            return content.split('\n');
        }
        // index file was not found create it, after searching for the needed files
        // read file to find the indexes
        let files = this.fs.find('public', { matching: ['*.html.json'] });
        // search for the content in the file and return the original source
        files = files
            .map((file) => {
                const content = this.fs.read(file);
                const found = content.indexOf(`"${filePath}"`) > -1;
                if (!found) {
                    return null;
                }
                const data = JSON.parse(content);
                return data.source;
            })
            .filter((file) => file != null);

        console.log(files);
        this.setIndex(indexPath, files);
    }
    setIndex(filePath: string, files: string[]) {
        // read file to find the indexes
        this.fs.write(filePath, files.join('\n'));
    }
    getIndexFilePath(filePath: string) {
        const path = this.fs.path(`indexes${filePath.replace(/\.hbs$/i, '.txt')}`);
        return path;
    }
    generateIndexesOfFile(filePath: string, builder: Builder) {
        const data = builder.getData(filePath);

        let resources = [];
        // load the resources of the given file data
        if (data.theme != null) {
            resources.push(`/theme/${data.theme}`);
        }
        if (data.page != null) {
            resources.push(`${this.path.dir(data.source)}/${data.page}`);
        }
        if (data.partials != null) {
            const partials = Object.keys(data.partials);
            partials.map((partial: string)=> {
                resources.push(`/partials/${data.partials[partial]}`);
            });
        }
        if (data.snippets != null) {
            const snippets = Object.keys(data.snippets);
            snippets.map((snippet: string)=> {
                resources.push(`/snippets/${data.snippets[snippet]}`);
            });
        }

        // add the current file to the index of the resources
        resources.map((res)=> {
            //console.log(res)
            const path = this.getIndexFilePath(res);
            //console.log(path)
            let content = this.fs.read(path);
            if(!content) {
                content = '';
            }
            // only add the source, when not already exists
            if(content.indexOf(data.source) == -1) {
                this.fs.append(path, `${data.source}\n`);
            }
        })

        //console.log(resources);
    }
}
