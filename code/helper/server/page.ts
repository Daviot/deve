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
        if (req.originalUrl == '/api/page') {
            await this.all(req, res);
        } else {
            await this.get(req, res);
        }
    }
    async all(req: any, res: any) {
        const files = await this.path.getAllContentFiles();
        const pages: any[] = await Promise.all(
            files.map(async (path: string) => {
                const data = await this.getPageData(path);
                if (!data) {
                    return null;
                }
                data.api = `api/page/${path}`; // direct link to the item
                return data;
            })
        );

        res.status(200).json(pages);
    }

    async get(req: any, res: any) {
        const path = this.builder.path.searchFile(req.path);
        if (path) {
            const data = await this.getPageData(path);
            res.status(200).json(data);
            return;
        }
        res.status(404).end('Not found');
    }

    async getPageData(path: string): Promise<any> {
        const data = await this.builder.getData(path);
        if (!data) {
            return null;
        }
        data.path = path;
        // print a reduced public path
        data.destination = data.destination.replace(this.fs.cwd() + '/', '');
        return data;
    }
}
