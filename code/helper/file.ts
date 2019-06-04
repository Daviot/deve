import { Logger } from './logger';
import { FSJetpack } from 'fs-jetpack/types';
import { AssetHelperModule } from '../model/AssetHelper';
export class FileHelper implements AssetHelperModule {
    fs: FSJetpack;
    constructor(fs: FSJetpack, private logger: Logger) {
        this.fs = fs;
    }

    async process(data: any): Promise<any> {
        this.logger.debug(this, data);
        return data;
    }
    async metaData(filePath: string): Promise<any> {
       return this.fs.inspect(filePath);
    }
    async generate(data: any): Promise<any> {
        return data.src;
    }
}
