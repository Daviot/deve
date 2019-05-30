import { FSJetpack } from 'fs-jetpack/types';
import { Hooks } from '../model/hooks';
export class Assets {
    private store: any = {};
    constructor(private fs: FSJetpack, private hooks: Hooks) {}

    /**
     * Loads all available assets for the given data
     */
    async load(data: any) {
        const beforeHookedData = await this.hooks.call('builder:assets:load#before', data);
        if (beforeHookedData) {
            data = beforeHookedData;
        }
        if (data.assets != null) {
            const keys = Object.keys(data.assets);
            data.assets = keys
                .map((key) => {
                    const asset = data.assets[key];
                    let assetData = {
                        src: '',
                        width: 0,
                        height: 0,
                        name: key,
                        srcRelative: '',
                        extension: ''
                    };
                    switch (typeof asset) {
                        case 'object':
                            //@todo handle complex assets
                            break;
                        case 'string':
                            const path = `assets/${asset}`;
                            console.log('');
                            console.log(this.fs.path(path));
                            // check if file exists
                            if (!this.fs.exists(path)) {
                                console.log(`asset "${key}" in "${data.source}" doesn't exist`);
                                return;
                            }
                            //const info = this.fs.inspect(path);
                            //@todo detect if the file is an image, otherwise stop here
                            //@todo get dimensions of image
                            assetData.src = `${data.baseUrl}/${path}`;
                            assetData.srcRelative = path;
                            const ext = path.split('.');
                            assetData.extension = ext[ext.length - 1].toLowerCase();
                            break;
                        default:
                            console.log(`unknown asset "${key}" in "${data.source}"`);
                            return null;
                    }
                    return assetData;
                })
                .filter((asset) => asset != null);
        }
        const afterHookedData = await this.hooks.call('builder:assets:load#after', data);
        if (afterHookedData) {
            data = afterHookedData;
        }
        return data;
    }

    get(asset: any, key: string) {
        console.log(key.split('.'));
        return key;
    }

    async replace(source: string, assets: any) {
        const beforeHookedSource = await this.hooks.call('builder:assets:replace#before', source);
        if (beforeHookedSource) {
            source = beforeHookedSource;
        }
        if (assets) {
            console.log(assets)
            const keys = Object.keys(assets);
            keys.map((key) => {
                source = source.replace(new RegExp('\\(\\(' + key + '\\)\\)', 'gi'), this.get(assets, key));
            });
        }
        const afterHookedSource = await this.hooks.call('builder:assets:replace#after', source);
        if (afterHookedSource) {
            source = afterHookedSource;
        }
        return source;
    }
}
