import express = require('express');

export class BaseController {
    readonly UNIVERSAL_PATH = '/';

    minimatch:any;

    constructor() {
        this.minimatch = require('minimatch');
    }

    isUniversalPath(req: express.Request): boolean {
        if (!req || !req.path) {
            return false;
        }
        return req.path === this.UNIVERSAL_PATH;
    }

    getFields(req: express.Request): string[] {
        if (!req || !req.query || !req.query.fields) {
            return [];
        }
        return req.query.fields
            .split(',')
            .map((field: string) => {
                return field.trim().toLowerCase();
            })
            .filter((field: string) => field != '');
    }
}
