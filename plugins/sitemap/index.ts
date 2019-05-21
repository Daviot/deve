import { Hooks } from './../../code/model/hooks';
import { Plugin } from '../../code/model/plugin';

export default class SitemapPlugin extends Plugin {
    sites:any[] = [];
    constructor(private hooks: Hooks) {
        super();

        this.hooks.set('builder#after', async (files: string[])=> {
            //console.log(files)
            console.log('after');
            console.log(files);
            return files;
        });
    }


}
