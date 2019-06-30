import * as fs from 'fs-jetpack';
import { promisify } from 'util';
export class Path {
    glob: any;

    constructor() {
        this.glob = promisify(require('glob'));
    }
    dir(path: string): string {
        const exists = fs.exists(path);
        switch (exists) {
            case 'file':
                let split = path.split('/');
                split.pop();
                const dir = split.join('/').replace(`${fs.cwd()}`, '');
                return dir;
            case 'dir':
                return path.replace(`${fs.cwd()}`, '');
            default:
                console.error(`path does not exist "${path}"`);
                return '';
        }
    }

    searchFile(path:string):string {
        path = `content${path}`;
        let foundPath = null;
        // check if the path exists
        if (fs.exists(path)) {
            foundPath = path;
        }
        // try to search json
        if (!foundPath) {
            let filePath = path + '.json';
            if (fs.exists(filePath) == 'file') {
                foundPath = filePath;
            }
        }
        // try to search index.json inside folder
        if (!foundPath) {
            let filePath = path + '/index.json';
            if (fs.exists(filePath) == 'file') {
                foundPath = filePath;
            }
        }
        return foundPath;
    }

    toSlug(filePath:string): string {
        let slug = filePath.replace(/\.json$/gi, '');
        slug = slug.replace(/^content\//gi, '/');
        return slug;
    }

    fromSlug(slug: string) {
        // replace unneeded parts
        slug = slug.replace(/\/index\//gi, '/').replace(/\/index$/gi, '/');
        // remove the current path to the content, to move it to the public folder
        slug = slug.replace(`${fs.cwd()}/content`, '');
        // change file folder to public
        const path = fs.path(`public/${slug}`);

        if (path.split('/').pop().indexOf('.') < 0) {
            // append index.html to the slug
            const filePath = fs.path(path, 'index.html');
            return filePath;
        }
        return path;
    }

    async getAllContentFiles(): Promise<string[]> {
        let files = await this.glob('content/**/*.json');
        return files;
    }
}
