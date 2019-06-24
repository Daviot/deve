import { FSJetpack } from 'fs-jetpack/types';
import { Logger } from './../logger';
import express = require('express');
export class AuthController {
    jwt: any = require('jsonwebtoken');
    bcrypt: any = require('bcrypt');
    public router = express.Router();
    constructor(private app:any, private key:any, private server:any, private fs: FSJetpack, private logger:Logger) {

        this.router.post('/login', this.login.bind(this));

        this.logger.info(this, `Auth token expires in ${this.server.tokenExpiresIn}`)

        this.app.use((req: any, res: any, next: Function) => {
            // login will be allways allowed
            if(req.originalUrl == '/api/auth/login') {
                next();
                return;
            }
            try {
                const token = req.headers.authorization.split(' ')[1];
                this.jwt.verify(token, this.key.token, (err: any | null, payload: any) => {
                    // successfully authenticated
                    if (payload) {
                        next();
                        return;
                    }
                });
            } catch (e) {
                this.logger.error(this, e);
            }
            res.status(403).end('Forbidden');
        });

    }

    async login(req: any, res: any) {
        if (req.body.email && req.body.password) {
            let user: any = await this.loginAllowed(req.body.email, req.body.password);
            if (user) {
                this.logger.info(this, `user "${user.email}" logged in`);
                // create token to be logged in
                const token = this.jwt.sign(user, this.key.token, { expiresIn: this.server.tokenExpiresIn });
                // remove the hash of the user object
                delete user.hash;
                // add the token
                user.token = token;
                res.status(200).json(user);
                return;
            }
        }
        // login failed
        res.status(400).end('Bad Request');
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
