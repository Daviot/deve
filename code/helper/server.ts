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
            this.logger.info(this, `request url "${req.originalUrl}" method "${req.method}"`);
            next();
        });
        this.app.use((err: any, req: any, res: any, next: Function) => {
            this.logger.error(this, err.stack);
            res.status(500).send('An error occured');
        });
        this.app.use((req: any, res: any, next: Function) => {
            try {
                const token = req.headers.authorization.split(' ')[1];
                this.jwt.verify(token, this.key.token, (err: any | null, payload: any) => {
                    console.log(payload);
                    if (payload) {
                        console.log(payload);
                        next();
                    } else {
                        next();
                    }
                });
            } catch (e) {
                next();
            }
        });

        this.app.use('/api/auth', (new AuthController(this.app, this.key, this.fs, this.logger)).router)

        this.app.listen('3001' || process.env.PORT, () => {
            this.logger.info(this, 'Server started');

            if (callback && typeof callback == 'function') {
                callback();
            }
        });
    }
}
