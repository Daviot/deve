import { Hooks } from './../../code/model/hooks';
import { Plugin } from '../../code/model/plugin';

export default class SitemapPlugin extends Plugin {
    constructor(private hooks: Hooks) {
        super();

        this.hooks.set('builder:get-data#after', (data: any)=> {
            //@todo write sitemap file
            return data;
        });
    }


}
