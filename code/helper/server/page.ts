import { Path } from './../path';
import { FSJetpack } from 'fs-jetpack/types';
import { Logger } from '../logger';
import express = require('express');
import { Builder } from '../builder';
export class PageController {
    public router = express.Router();
    path: Path;

    constructor(private app: any, private options: any, private builder: Builder, private fs: FSJetpack, private logger: Logger) {
        this.path = new Path();

        this.router.get('/*', this.getOneOrAll.bind(this));
    }

    async getOneOrAll(req: any, res: any) {

        if(req.originalUrl == '/api/page') {
            await this.all(req, res);
        } else {
            await this.get(req, res);
        }
    }
    async all(req: any, res: any) {
        console.log('all')
        this.path.getAllContentFiles().then((files: string[])=> {
            console.log(files)
            const pages: any[] = files.map((file: string) => {
                return {
                    path: file,
                    api: `api/page/${file}`
                }
            });

            res.status(200).json(pages);
        });
    }

    async get(req: any, res: any) {
        const path = this.builder.path.searchFile(req.path);
        if (path) {
            res.status(200).json({
                original: req.originalUrl,
                path: path
            });
            return;
        }
        res.status(404).end('Not found');
    }
}
