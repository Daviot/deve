import { Logger } from './../helper/logger';
import { FSJetpack } from 'fs-jetpack/types';
import { ImageHelper } from '../helper/image';
import { FileHelper } from '../helper/file';
import { Tracing } from 'trace_events';

export class AssetHelper {
    image: ImageHelper;
    file: FileHelper;
    minimatch: any;
    merge = require('deepmerge');
    assetQueue: any[] = [];

    constructor(fs: FSJetpack, private config: any, private logger: Logger) {
        this.image = new ImageHelper(fs, this.logger);
        this.file = new FileHelper(fs, this.logger);
        this.minimatch = require('minimatch');
    }

    async metaData(path: string): Promise<any> {
        if (!path) {
            return null;
        }
        const helper = this.getHelper(path);
        this.logger.debug(this, helper.constructor.name);
        return await helper.metaData(path);
    }

    getHelper(path: string): any {
        switch (this.getType(path)) {
            case 'image':
                return this.image;
            case 'file':
            default:
                return this.file;
        }
    }

    async process() {
        // handle only valid assets with path attribute
        const queue = this.assetQueue.filter((asset)=> asset && asset.path && asset.path != '');

        const result = await Promise.all(queue.map(async (asset)=> {
            const helper = this.getHelper(asset.path);
            const result = await helper.process(asset);
            return result;
        }));
    }

    async queue(data: any) {
        if (!data) {
            return null;
        }
        this.assetQueue.push(data);
        return data;
    }
    async generate(data: any) {
        if (!data) {
            return null;
        }
        const helper = this.getHelper(data.src);
        this.logger.debug(this, helper.constructor.name);
        return await helper.generate(data);
    }

    getType(path: string): string {
        const parts = path.split('.');
        if (parts.length > 1) {
            const ext = parts[parts.length - 1];
            this.logger.debug(this, `extension "${ext}"`);
            if ('jpg,jpeg,gif,png,webp'.indexOf(ext) > -1) {
                return 'image';
            }
        }
        return 'file';
    }

    getData(data: any): any {
        if (!data) {
            return null;
        }
        const type = this.getType(data.src);
        // load the config of the source
        const config = this.config.assets[type];
        if (!config) {
            return data;
        }
        // sort patterns by length
        const patterns = Object.keys(config).sort((a, b) => b.length - a.length);
        let patternKey = patterns.find((pattern) => this.minimatch(data.src, pattern) || pattern == '*');

        if (patternKey) {
            const patternList = config[patternKey];
            // make a clone
            const clone = JSON.parse(JSON.stringify(data));
            // enhance data object with the configurations
            patternList.map((pattern:any)=> {
                data[pattern.name] = this.merge(pattern, clone);
                let path = ['assets', type];
                if(type == 'image') {
                    path.push(`${data[pattern.name].width || '_'}x${data[pattern.name].height || '_'}`);
                }
                path.push(pattern.name);
                data[pattern.name].path = `public/${path.join('/')}/${data[pattern.name].path}`;
                data[pattern.name].src = `${this.config.page.baseUrl}/${data[pattern.name].path}`;
            });
        }
        return data;
    }
}

export interface AssetHelperModule {
    fs: FSJetpack;
    process(data: any): Promise<any>;
    metaData(path: string): Promise<any>;
    generate(data: any): Promise<any>;
}

export class AssetData {
    src: string = '';
    path: string = '';
    name: string = '';
    srcRelative: string = '';
    extension: string = '';
    meta: any = {};

    constructor(name: string = null) {
        if(name) {
            this.name = name;
        }
    }
}
