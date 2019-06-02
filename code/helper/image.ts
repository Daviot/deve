import { Logger } from './logger';
import { FSJetpack } from 'fs-jetpack/types';
import { Sharp } from 'sharp';
import sharp = require('sharp');
import { AssetHelperModule } from '../model/AssetHelper';

export class ImageHelper implements AssetHelperModule {
    fs: FSJetpack;
    constructor(fs: FSJetpack, private logger: Logger) {
        this.fs = fs;
    }

    async process(imagePath: string, options: any): Promise<string> {
        this.logger.debug(this, imagePath);
        return imagePath;
    }
    async metaData(imagePath: string): Promise<any> {
        const image = sharp(imagePath);
        const metaData = await image.metadata();
        let fileMeta = await this.fs.inspect(imagePath);

        return Object.assign(fileMeta, metaData);
    }
}
