import { FSJetpack } from 'fs-jetpack/types';
import { Logger } from '../logger';
import express = require('express');
export class ServerController {
    public router = express.Router();
    constructor(private app:any, private options:any, private fs: FSJetpack, private logger:Logger) {

        this.router.post('/status', this.status.bind(this));



    }

    async status(req: any, res: any) {
        let status = {
            upTime: (new Date()).getTime() - this.options.server.startTime,
            build: this.options.build
        };

        res.status(200).json(status);
    }

}
