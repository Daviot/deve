import { Builder } from './builder';
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
import { PageController } from './server/page';
import express = require('express');

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
    private key: any;

    constructor(
        private templateEngine: any,
        private fs: FSJetpack,
        private builder: Builder,
        private partials: Partials,
        private snippets: Snippets,
        private events: Events,
        private hooks: Hooks,
        private assets: Assets,
        private logger: Logger,
        private options: any
    ) {
        this.path = new Path();
    }

    start(callback: Function) {
        this.logger.info(this, 'Starting Server');
        const express = require('express'),
            helmet = require('helmet');
        try {
            this.key = JSON.parse(this.fs.read('config/key.json'));
        } catch (e) {
            this.logger.error(this, "key for jwt authentication couln't be found", e);
        }



        this.app = express();
        this.app.use(require('body-parser').json());
        // web security
        this.app.use(helmet())

        // handle server errors
        this.app.use((err: any, req: express.Request, res: express.Response, next: Function) => {
            this.logger.error(this, err.stack);
            res.status(500).send('An error occured');
        });

        // register controller
        this.app.use('/api/auth', new AuthController(this.app, this.key, this.options.server, this.fs, this.logger).router);
        this.app.use('/api/server', new ServerController(this.app, this.options, this.fs, this.logger).router);
        this.app.use('/api/pages', new PageController(this.app, this.options, this.builder, this.fs, this.logger).router);

        // Handle unknown routes
        this.app.use((req: express.Request, res: express.Response) => {
            this.logger.warn(this, `Not found ${req.originalUrl}`);
            res.status(404).send('Not found');
        });

        const port = this.options.server.port || process.env.PORT;
        this.app.listen(port || process.env.PORT, () => {
            this.logger.info(this, `Server started on port ${port}`);
            this.options.server.startTime = new Date().getTime();

            if (callback && typeof callback == 'function') {
                callback();
            }
        });
    }
}
