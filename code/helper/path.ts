import * as fs from 'fs-jetpack';
export class Path {
    dir(path: string): string {
        const exists = fs.exists(path);
        switch (exists) {
            case 'file':
                let split = path.split('/');
                split.pop();
                return fs.path(split.join('/'));
            case 'dir':
                return fs.path(path);
            default:
                console.error(`path does not exist "${path}"`);
                return '';
        }
    }

    toSlug(filePath:string) {
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
}
