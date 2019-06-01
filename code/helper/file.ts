import { Logger } from './logger';
import { FSJetpack } from 'fs-jetpack/types';
import { AssetHelperModule } from '../model/AssetHelper';
export class FileHelper implements AssetHelperModule {
    fs: FSJetpack;
    constructor(fs: FSJetpack, private logger: Logger) {
        this.fs = fs;
    }

    async process(filePath: string, options: any): Promise<string> {
        this.logger.debug(this, filePath, options);
        return filePath;
    }
    async metaData(filePath: string): Promise<any> {
       return this.fs.inspect(filePath);
    }
}
