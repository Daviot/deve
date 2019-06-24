import { Logger } from './logger';
import { Path } from './path';
import { FSJetpack } from 'fs-jetpack/types';
import { Partials } from './partials';
import { Snippets } from './snippets';
import { Events } from './events';
import { Hooks } from '../model/hooks';
import { Assets } from './assets';
import { defaultCoreCipherList } from 'constants';
import { AuthController } from './server/auth';
import { ServerController } from './server/server';

export class Server {
    template: string = '';
    path: Path;
    process = {
        current: 0,
        amount: 0
    };
    merge = require('deepmerge');
    app: any; // Express
    jwt: any = require('jsonwebtoken');
    bcrypt: any = require('bcrypt');
    c: any;
    spinner: any;
    private key: any;

    constructor(
        private templateEngine: any,
        private fs: FSJetpack,
        private partials: Partials,
        private snippets: Snippets,
        private events: Events,
        private hooks: Hooks,
        private assets: Assets,
        private logger: Logger,
        private options: any
    ) {
        this.path = new Path();
        this.c = require('ansi-colors');
    }

    start(callback: Function) {
        this.logger.info(this, 'Starting Server');
        const express = require('express');
        try {
            this.key = JSON.parse(this.fs.read('config/key.json'));
        } catch (e) {
            this.logger.error(this, "key for jwt authentication couln't be found", e);
        }

        const ora = require('ora');
        this.spinner = ora({
            color: 'red'
        });

        this.app = express();
        this.app.use(require('body-parser').json());
        // logger
        this.app.use((req: any, res: any, next: Function) => {
            this.spinner.start(`${this.c.dim(req.method)} ${req.originalUrl}`);
            res.on('finish', () => {
                this.spinner.succeed(`${this.c.dim(req.method)} ${req.originalUrl}`);
            });
            this.logger.info(this, `request url "${req.originalUrl}" method "${req.method}"`, req.body);
            next();
        });
        // Handle unknown routes
        this.app.use((req: any, res: any) => {
            this.logger.warn(this, `Not found ${req.originalUrl}`);
            res.status(404).send('Not found');
        });

        // handle server errors
        this.app.use((err: any, req: any, res: any, next: Function) => {
            this.logger.error(this, err.stack);
            res.status(500).send('An error occured');
        });

        // register controller
        this.app.use('/api/auth', (new AuthController(this.app, this.key, this.options.server, this.fs, this.logger)).router)
        this.app.use('/api/server', (new ServerController(this.app, this.options, this.fs, this.logger)).router)

        const port = this.options.server.port || process.env.PORT;
        this.app.listen(port || process.env.PORT, () => {
            this.logger.info(this, `Server started on port ${port}`);
            this.options.server.startTime = (new Date()).getTime();

            if (callback && typeof callback == 'function') {
                callback();
            }
        });
    }
}
