import { Path } from './../path';
import { FSJetpack } from 'fs-jetpack/types';
import { Logger } from '../logger';
import express = require('express');
import { Builder } from '../builder';
export class PageController {
    public router = express.Router();
    path: Path;
    readonly UNIVERSAL_PATH = '/api/pages';

    constructor(private app: any, private options: any, private builder: Builder, private fs: FSJetpack, private logger: Logger) {
        this.path = new Path();

        this.router.post('/*', this.create.bind(this));
        this.router.get('/*', this.read.bind(this));
        this.router.put('/*', this.update.bind(this));
        this.router.delete('/*', this.delete.bind(this));
    }

    async create(req: any, res: any) {
        res.send('Not implemented');
    }
    async read(req: any, res: any) {
        if (req.originalUrl == this.UNIVERSAL_PATH) {
            await this.readAll(req, res);
        } else {
            await this.readSingle(req, res);
        }
    }
    async update(req: any, res: any) {
        if (req.originalUrl == this.UNIVERSAL_PATH) {
            await this.updateBatch(req, res);
        } else {
            await this.updateSingle(req, res);
        }
    }
    async delete(req: any, res: any) {
        res.send('Not implemented');
    }

    async readAll(req: any, res: any) {
        const files = await this.path.getAllContentFiles();
        const pages: any[] = await Promise.all(
            files.map(async (path: string) => {
                const data = await this.getPageData(path);
                if (!data) {
                    return null;
                }
                data.api = `api/pages/${path}`; // direct link to the item
                return data;
            })
        );

        res.status(200).json(pages);
    }

    async readSingle(req: any, res: any) {
        const path = this.builder.path.searchFile(req.path);
        if (path) {
            const data = await this.getPageData(path);
            res.status(200).json(data);
            return;
        }
        res.status(404).end('Not found');
    }

    async updateBatch(req: any, res: any) {}
    async updateSingle(req: any, res: any) {
        const path = this.builder.path.searchFile(req.path);
        if (path) {
            const data = await this.getPageData(path);
            const keys = Object.keys(req.body);
            keys.map((key) => {
                data[key] = req.body[key];
            });
            // update the template
            this.fs.write(path, data);
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
    setPageData(path: string, data: any): boolean {
        return true;
    }
}
