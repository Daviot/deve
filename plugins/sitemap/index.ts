import { Hooks } from './../../code/model/hooks';
import { Plugin, PluginFramework } from '../../code/model/plugin';

export default class SitemapPlugin extends Plugin {
    sites:any[] = [];
    constructor(wyver: PluginFramework) {
        super(wyver);
        wyver.hooks.set('builder#after', async (files: any[])=> {
            // filter out only public files
            const publicFiles = files.filter((file)=> file.private == false);



            // return the original files because other plugins may also need the infos, only append data to it
            return files;
        });
    }


}
