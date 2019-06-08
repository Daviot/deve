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

    async process(asset: any): Promise<string> {
        let image = sharp(asset.srcRelative);
        // @see https://sharp.pixelplumbing.com/en/stable/api-resize/
        let resizeOptions:any = { kernel: sharp.kernel.nearest, fit: 'contain', position: 'center' };
        if(asset.width) {
            resizeOptions.width = parseInt(asset.width, 10);
        }
        if(asset.height) {
            resizeOptions.height = parseInt(asset.height, 10);
        }
        if(asset.crop && asset.crop == true) {
            resizeOptions.fit = 'cover';
        }
        if(resizeOptions.width || resizeOptions.height) {
            image = image.resize(resizeOptions);
        }
        if(!this.fs.exists(asset.path)) {
            const parts = asset.path.split('/');
            const fs = this.fs;
            parts.pop();
            fs.dir(parts.join('/'));
        }
        // process image
        try {
            const result = await image.toFile(asset.path);
            this.logger.info(this, `process image "${asset.srcRelative}" and move to "${asset.path}"`)
        } catch(e) {
            this.logger.error(this, e);
        }
        return asset;
    }
    async metaData(imagePath: string): Promise<any> {
        const image = sharp(imagePath);
        const metaData = await image.metadata();
        let fileMeta = await this.fs.inspect(imagePath);

        return Object.assign(fileMeta, metaData);
    }
    async generate(data: any): Promise<any> {
        return `<img src="${data.src}" />`;
    }
}
