import { Hooks } from './../../code/model/hooks';
import { DevePlugin } from '../../code/model/plugin';
import { minify } from 'html-minifier';

export default class HtmlMinifierPlugin extends DevePlugin {
    constructor(private hooks: Hooks) {
        super();


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
