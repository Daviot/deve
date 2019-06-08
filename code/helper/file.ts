import { Logger } from './logger';
import { FSJetpack } from 'fs-jetpack/types';
import { AssetHelperModule } from '../model/AssetHelper';
export class FileHelper implements AssetHelperModule {
    fs: FSJetpack;
    constructor(fs: FSJetpack, private logger: Logger) {
        this.fs = fs;
    }

    async process(asset: any): Promise<any> {
        this.fs.copy(asset.srcRelative, asset.path);
        this.logger.info(this, `move asset "${asset.srcRelative}" to "${asset.path}"`)
        return asset;
    }
    async metaData(filePath: string): Promise<any> {
       return this.fs.inspect(filePath);
    }
    async generate(data: any): Promise<any> {
        return data.src;
    }
}
