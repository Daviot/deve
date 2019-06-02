import { Logger } from './logger';
import { FSJetpack } from 'fs-jetpack/types';
import { Hooks } from '../model/hooks';
import { AssetHelper } from '../model/AssetHelper';
export class Assets {
    private store: any = {};
    constructor(private fs: FSJetpack, private hooks: Hooks, private assetHelper: AssetHelper, private config: any, private logger: Logger) {}

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
                        let assetData = {
                            src: '',
                            name: key,
                            srcRelative: '',
                            extension: '',
                            meta: {}
                        };
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
        return data;
    }

    get(assets: any, key: string) {
        if (assets && assets.length > 0) {
            const asset = assets.find((a: any) => a.name == key);
            return asset;
        }
        return '';
    }

    async replace(source: string, assets: any) {
        const beforeHookedSource = await this.hooks.call('builder:assets:replace#before', source);
        if (beforeHookedSource) {
            source = beforeHookedSource;
        }
        if (assets && assets.length > 0) {
            await Promise.all(assets.map(async (asset: any) => {
                const assetData = this.get(assets, asset.name);
                // list all occuring matches inside the source
                const matches = source.match(new RegExp(`\\(\\(\\s*?(${asset.name}.*?)\\)\\)`, 'gi'));
                // when asset is not found go to next asset
                if (!matches) {
                    return;
                }
                this.logger.debug(this, `asset "${assetData.name}" found`, matches);
                // search and replace every match
                await Promise.all(
                    matches.map(async (match) => {
                        // prepare the match because "((asset))" can not be used as regex
                        const regexMatchPattern = match.replace(/\(/g, '\\(').replace(/\)/g, '\\)');
                        const matchKey = match
                            .replace(/\(/g, '')
                            .replace(/\)/g, '')
                            .trim();

                        // get the content to replace
                        const content = await this.replaceContent(matchKey, assetData);

                        // replace the new content with the placeholder
                        source = source.replace(new RegExp(regexMatchPattern, 'gi'), content);
                    })
                );
                this.logger.debug(this, source);
            }));
        }
        const afterHookedSource = await this.hooks.call('builder:assets:replace#after', source);
        if (afterHookedSource) {
            source = afterHookedSource;
        }
        return source;
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

            data = this.assetHelper.getData(data);
            const assetData = await this.assetHelper.process(data.src, data);
            // @todo make magic content, <img> tag for images and videos and so on...
            return JSON.stringify(assetData);
        }
        return data;
    }
}
