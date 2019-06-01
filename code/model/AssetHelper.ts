import { Logger } from './../helper/logger';
import { FSJetpack } from 'fs-jetpack/types';
import { ImageHelper } from '../helper/image';
import { FileHelper } from '../helper/file';

export class AssetHelper {
    image: ImageHelper;
    file: FileHelper;

    constructor(fs: FSJetpack, private logger: Logger) {
        this.image = new ImageHelper(fs, this.logger);
        this.file = new FileHelper(fs, this.logger);
    }

    async metaData(path: string): Promise<any> {
        if(!path) {
            return null;
        }
        const helper = this.getHelper(path);
        this.logger.debug(this, helper.constructor.name)
        return await helper.metaData(path);
    }

    getHelper(path: string): any {
        const parts = path.split('.');
        if(parts.length > 1) {
            const ext = parts[parts.length -1];
            this.logger.debug(this, `extension "${ext}"`);
            if("jpg,jpeg,gif,png,webp".indexOf(ext) > -1) {
                return this.image;
            }
        }
        return this.file;
    }
}

export interface AssetHelperModule {
    fs: FSJetpack;
    process(path: string, options: any): Promise<string>;
    metaData(path: string): Promise<any>;
}
