import { Hooks } from './../../code/model/hooks';
import { Plugin } from '../../code/model/plugin';
import { minify } from 'html-minifier';

export default class HtmlMinifierPlugin extends Plugin {
    constructor(private hooks: Hooks) {
        super();

        this.hooks.set('builder:generate#after', (source: string)=> {
            return '<!--minified-->'+this.minify(source);
        });
    }

    minify(source: string) {
        return <string>minify(source, {
            keepClosingSlash: true,
            removeAttributeQuotes: true,
            removeComments: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true
        });
    }
}
