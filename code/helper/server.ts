import { Logger } from './logger';
import { Path } from './path';
import { FSJetpack } from 'fs-jetpack/types';
import { Partials } from './partials';
import { Snippets } from './snippets';
import { Events } from './events';
import { Hooks } from '../model/hooks';
import { Assets } from './assets';
import { defaultCoreCipherList } from 'constants';

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
        const express = require('express');
        try {
            this.key = JSON.parse(this.fs.read('config/key.json'));
        } catch (e) {
            this.logger.error(this, "key for jwt authentication couln't be found", e);
        }

        this.app = express();
        this.app.use(require('body-parser').json());
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
        this.app.post('/api/auth/login', async (req: any, res: any) => {
            if (req.body.email && req.body.password) {
                let user: any = await this.loginAllowed(req.body.email, req.body.password);
                if (user) {
                    console.log(user);
                    // create token to be logged in
                    const token = this.jwt.sign(user, this.key.token, { expiresIn: '1h' });
                    // remove the hash of the user object
                    delete user.hash;
                    // add the token
                    user.token = token;
                    res.status(200).json(user);
                }
            }
            // login failed
            res.status(403).json();
        });

        this.app.listen('3001' || process.env.PORT, () => {
            if (callback && typeof callback == 'function') {
                callback();
            }
        });
    }

    async loginAllowed(email: string, password: string): Promise<any | boolean> {
        if (!email || !password) {
            return false;
        }

        const users = JSON.parse(this.fs.read('config/users.json'));

        const hash = await this.bcrypt.hash(this.getLoginText(email, password, this.key.token), this.key.saltRounds);

        const possibleUser = users.find((user: any) => {
            const match = user.email === email;
            return match;
        });

        if (!possibleUser) {
            return false;
        }
        // when user doesn't have a password, set the value
        if (possibleUser.hash == null || possibleUser.hash == '') {
            possibleUser.hash = hash;
            // save the new password to the config file
            const prepareUser = users.map((user: any) => {
                if (user.email == email) {
                    user.hash = hash;
                }
                return user;
            });

            this.fs.write('config/users.json', prepareUser);
        }
        const valid = await this.bcrypt.compare(this.getLoginText(email, password, this.key.token), possibleUser.hash);
        if (valid) {
            return possibleUser;
        }

        return false;
    }

    getLoginText(email: string, password: string, key: string): string {
        return JSON.stringify({
            email: email,
            password: password,
            key: key
        });
    }
}
