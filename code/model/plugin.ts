import { Logger } from './../helper/logger';
import { FSJetpack } from 'fs-jetpack/types';
import { Events } from './../helper/events';
import { Builder } from './../helper/builder';
import { Hooks } from './hooks';
export class Plugin {
    wyvr: PluginFramework;
    constructor(wyvr: PluginFramework) {}
}

export class PluginFramework {
    builder: PluginFrameworkBuilder;
    hooks: Hooks;
    events: Events;
    fs: PluginFrameworkFS;
    config: PluginFrameworkConfig;
    logger: Logger;
    constructor(hooks: Hooks, builder: Builder, events: Events, fs: FSJetpack, logger: Logger, config: any) {
        this.builder = new PluginFrameworkBuilder(builder);
        this.hooks = hooks;
        this.events = events;
        this.fs = new PluginFrameworkFS(fs);
        this.config = new PluginFrameworkConfig(config);
        this.logger = logger;
    }
}

export class PluginFrameworkBuilder {
    constructor(private builder: Builder) {}
    async compile(data: any) {
        return await this.builder.compile(data);
    }
}
export class PluginFrameworkFS {
    constructor(private fs: FSJetpack) {}

    read(filePath: string) {
        //@todo check if read is in the current project folder not outside, security
        return this.fs.read(filePath);
    }
    write(filePath: string, content: string) {
        //@todo check if write is in the current project folder not outside, security
        return this.fs.write(filePath, content);
    }
    getPath(filePath: string) {
        if(filePath.indexOf('../') > -1) {
            filePath = filePath.replace(/\.\.\//g, '');
        }
        return this.fs.path(`public/${filePath}`);
    }
}

export class PluginFrameworkConfig {
    constructor(private config: any) {

    }
    get(name: string) {
        return this.config.config[name];
    }
}
