import { Hooks } from './../../code/model/hooks';
import { Plugin, PluginFramework } from '../../code/model/plugin';

export default class SitemapPlugin extends Plugin {
    sites: any[] = [];
    constructor(wyvr: PluginFramework) {
        super(wyvr);
        wyvr.hooks.set('builder#after', async (files: any[]) => {
            // filter out only public files
            let publicFiles = files.filter((file) => file.private == false);

            // convert lastModify of files to a sitemap valid format
            publicFiles = publicFiles.map((file) => {
                const date = new Date(file.lastModified);
                const month = date.getMonth() + 1;
                const day = date.getDate();
                file.lastModified = `${date.getFullYear()}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
                return file;
            });

            const sitemapFileTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    {{#each files}}
    <url>
        <loc>{{baseUrl}}{{slug}}{{#if config.slugWithTrailingSlash}}/{{/if}}</loc>
        <lastmod>{{lastModified}}</lastmod>
    </url>
    {{/each}}
</urlset>`;
            const data = { generated: sitemapFileTemplate, files: publicFiles };
            const sitemapContent = await wyvr.builder.compile(data);

            wyvr.fs.write(wyvr.fs.getPath('sitemap.xml'), sitemapContent);

            // return the original files because other plugins may also need the infos, only append data to it
            return files;
        });
    }
}
