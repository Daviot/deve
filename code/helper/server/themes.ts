import { Path } from '../path';
import { FSJetpack } from 'fs-jetpack/types';
import { Logger } from '../logger';
import express = require('express');
import { Builder } from '../builder';
export class ThemesController {
    public router = express.Router();
    path: Path;
    readonly UNIVERSAL_PATH = '/api/themes';

    constructor(private app: any, private options: any, private builder: Builder, private fs: FSJetpack, private logger: Logger) {
        this.path = new Path();

        this.router.post('/*', this.create.bind(this));
        this.router.get('/*', this.read.bind(this));
        this.router.put('/*', this.update.bind(this));
        this.router.delete('/*', this.delete.bind(this));
    }

    async create(req: express.Request, res: express.Response) {
        res.status(404).send('Not implemented');
    }
    async read(req: express.Request, res: express.Response) {
        if (req.originalUrl == this.UNIVERSAL_PATH) {
            await this.readAll(req, res);
        } else {
            await this.readSingle(req, res);
        }
    }
    async readAll(req: express.Request, res: express.Response) {
        const files = await this.path.getAllFiles('theme/**/*.hbs');
        const pages: string[] = files.map((path: string) => {
            return path.replace(/^theme\/(.*)$/gmi, 'api/themes/$1'); // direct link to the item
        });

        res.status(200).json(pages);
    }
    async readSingle(req: express.Request, res: express.Response) {
        res.status(404).send('Not implemented');
    }
    async update(req: express.Request, res: express.Response) {
        res.status(404).send('Not implemented');
    }
    async delete(req: express.Request, res: express.Response) {
        res.status(404).send('Not implemented');
    }
}
