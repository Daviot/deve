import { FSJetpack } from 'fs-jetpack/types';
import { pathToFileURL } from 'url';
export class Logger {
    path: string;
    color: any;
    constructor(private fs: FSJetpack, id: number) {
        this.path = `${this.fs.cwd()}/log/${id || 'wyvr'}.log`;
        if(this.fs.exists(this.path)) {
            this.fs.remove(this.path);
        }
        this.color = require('ansi-colors');
    }

    getPath() {
        return this.path;
    }

    log(level: LogLevel, context: any, ...data: any[]) {
        // console.log(context);
        // console.log(data);
        const icon = this.getLevelIcon(level);
        const iconColor = this.getLevelIconColor(level);
        const timestamp = this.getTimestamp();
        let name = '';
        if (context) {
            name = `@${context}`;
            if ((typeof context == 'function' || typeof context == 'object') && context.constructor && context.constructor.name) {
                name = `@${context.constructor.name}`;
            }
        }

        const dataConverted = data
            .map((entry) => {
                switch (typeof entry) {
                    case 'string':
                    case 'number':
                        return entry;
                    default:
                        return `${JSON.stringify(entry, null, '  ')}`;
                }
            })
            .join('\n');
        this.fs.append(this.path, `[${timestamp}] ${icon} ${name}\n`);
        this.fs.append(this.path, `${dataConverted}\n`);
    }

    debug(context: any, ...data: any[]) {
        this.log(LogLevel.debug, context, ...data);
    }
    info(context: any, ...data: any[]) {
        this.log(LogLevel.info, context, ...data);
    }
    warn(context: any, ...data: any[]) {
        this.log(LogLevel.warn, context, ...data);
    }
    error(context: any, ...data: any[]) {
        this.log(LogLevel.error, context, ...data);
    }
    getTimestamp() {
        const date = new Date();
        return `${date
            .getHours()
            .toString()
            .padStart(2, '0')}:${date
            .getMinutes()
            .toString()
            .padStart(2, '0')}:${date
            .getSeconds()
            .toString()
            .padStart(2, '0')}`;
    }
    getLevelIcon(level: LogLevel) {
        switch (level) {
            case LogLevel.debug:
                return '(#)';
            case LogLevel.info:
                return '(i)';
            case LogLevel.warn:
                return '[!]';
            case LogLevel.error:
                return '[X]';
            default:
                return `-${level}-`;
        }
    }

    getLevelIconColor(level: LogLevel) {
        return this.getLevelColor(level, this.getLevelIcon(level));
    }
    getLevelColor(level: LogLevel, content: any) {
        switch (level) {
            case LogLevel.debug:
                return this.color.green(content);
            case LogLevel.info:
                return this.color.blue(content);
            case LogLevel.warn:
                return this.color.yellow(content);
            case LogLevel.error:
                return this.color.red(content);
            default:
                return this.color.magenta(content);
        }
    }
    convertObjectToString(data: any) {}
}

export enum LogLevel {
    debug,
    info,
    warn,
    error
}
