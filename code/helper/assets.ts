import { Logger } from './logger';
import { FSJetpack } from 'fs-jetpack/types';
import { Hooks } from '../model/hooks';
import { AssetHelper, AssetData } from '../model/AssetHelper';
import { Events } from './events';
export class Assets {
    private store: any = {};
    constructor(private fs: FSJetpack, private hooks: Hooks, private events: Events, private assetHelper: AssetHelper, private config: any, private logger: Logger) {
        this.events.sub('builder:build:done', async (data: any) => {
            await this.assetHelper.process();
        });
    }

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
            data.assets = await Promise.all(
                keys
                    .map(async (key) => {
                        const asset = data.assets[key];
                        let assetData = new AssetData(key);
                        switch (typeof asset) {
                            case 'object':
                                //@todo handle complex assets
                                this.logger.error(this, `complex assets are currently not supported`, asset);
                                break;
                            case 'string':
                                const path = `assets/${asset}`;
                                // check if file exists
                                if (!this.fs.exists(path)) {
                                    this.logger.warn(`asset "${key}" in "${data.source}" doesn't exist`);
                                    return;
                                }
                                const metaData = await this.assetHelper.metaData(path);
                                this.logger.debug(this, metaData.name);
                                if (metaData.type != 'file') {
                                    this.logger.warn(this, `asset "${path}" is no file`, metaData);
                                    return;
                                }
                                //@todo detect if the file is an image, otherwise stop here
                                //@todo get dimensions of image
                                assetData.src = `${data.baseUrl}/${path}`;
                                assetData.path = asset;
                                assetData.srcRelative = path;
                                assetData.meta = metaData;
                                const ext = path.split('.');
                                assetData.extension = ext[ext.length - 1].toLowerCase();

                                break;
                            default:
                                this.logger.warn(`unknown asset "${key}" in "${data.source}"`);
                                return null;
                        }
                        return assetData;
                    })
                    .filter((asset) => asset != null)
            );
        }
        const afterHookedData = await this.hooks.call('builder:assets:load#after', data);
        if (afterHookedData) {
            data = afterHookedData;
        }
        this.logger.debug(this, `loaded assets for "${data.source}"`);
        // map the assets to the data object
        const assets = data.assets;
        data.assets = {};
        if(assets != null) {
            assets.map((asset: AssetData)=> {
                data.assets[asset.name] = this.assetHelper.getData(asset);
            });
        }
        return data;
    }

    get(assets: any, key: string) {
        if (assets && assets[key]) {
            const asset = assets[key];
            return asset;
        }
        return '';
    }

    async replace(data: any) {
        const beforeHookedData = await this.hooks.call('builder:assets:replace#before', data);
        if (beforeHookedData) {
            data = beforeHookedData;
        }
        const keys = Object.keys(data.assets);
        if (data.assets && keys.length > 0) {
            await Promise.all(keys.map(async (key: any) => {
                const assetData = data.assets[key];
                // list all occuring matches inside the source
                const matches = data.generated.match(new RegExp(`\\(\\(\\s*?(${assetData.name}.*?)\\)\\)`, 'gi'));
                // when asset is not found go to next asset
                if (!matches) {
                    return;
                }
                this.logger.debug(this, `asset "${assetData.name}" found`, matches);
                // search and replace every match
                await Promise.all(
                    matches.map(async (match:any) => {
                        // prepare the match because "((asset))" can not be used as regex
                        const regexMatchPattern = match.replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\./g, '\\.');
                        const matchKey = match
                            .replace(/\(/g, '')
                            .replace(/\)/g, '')
                            .trim();

                        // get the content to replace
                        const content = await this.replaceContent(matchKey, assetData);
                        this.logger.debug(regexMatchPattern, content)

                        // replace the new content with the placeholder
                        data.generated = data.generated.replace(new RegExp(regexMatchPattern, 'gi'), content);
                    })
                );
            }));
        }
        const afterHookedData = await this.hooks.call('builder:assets:replace#after', data);
        if (afterHookedData) {
            data = afterHookedData;
        }
        return data;
    }

    async replaceContent(key: string, asset: any) {
        if (!key || key == '' || !asset) {
            this.logger.warn(this, `no content for asset "${key}" available`, asset);
            return '';
        }
        const parts = key.split('.');
        let data: any = null;
        parts.map((part) => {
            if (!data) {
                data = asset;
                return;
            }
            const content = data[part];
            if (!content) {
                this.logger.error(this, `the part "${part}" of the asset doesn't exist`, data);
                return;
            }
            data = content;
        });

        // @todo add hook for the asset
        if (!data) {
            return '';
        }
        let src = data,
            options = {
                // default config of the assets
            };
        if (typeof data == 'object') {
            src = data.src;

            const emptyAsset = new AssetData();
            const dataBaseProperties = Object.keys(emptyAsset);
            const keys = Object.keys(data).filter((prop)=> dataBaseProperties.indexOf(prop) == -1);
            // find the default image
            let defaultImage = data[keys.find((key)=> {
                return data[key].default == true;
            })];
            // use first image config as "default"
            if(!defaultImage) {
                // when the current object also contains other options use this as default
                if(typeof data[keys[0]] == 'object' && Object.keys(data[keys[0]]).indexOf('src') > -1) {
                    defaultImage = data[keys[0]];
                } else {
                    // otherwise will the current data be the "defaultImage"
                    defaultImage = data;
                }
            }
            const assetData = await this.assetHelper.queue(defaultImage);
            // @todo make magic content, <img> tag for images and videos and so on...
            return await this.assetHelper.generate(assetData);
        }
        return data;
    }
}
