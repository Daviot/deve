import { FSJetpack } from 'fs-jetpack/types';
import { Events } from './../helper/events';
import { Builder } from './../helper/builder';
import { Hooks } from './hooks';
export class Plugin {
    wyver: PluginFramework;
    constructor(wyver: PluginFramework) {}
}

export class PluginFramework {
    builder: PluginFrameworkBuilder;
    hooks: Hooks;
    events: Events;
    fs: PluginFrameworkFS;
    config: PluginFrameworkConfig;
    constructor(hooks: Hooks, builder: Builder, events: Events, fs: FSJetpack, config: any) {
        this.builder = new PluginFrameworkBuilder(builder);
        this.hooks = hooks;
        this.events = events;
        this.fs = new PluginFrameworkFS(fs);
        this.config = new PluginFrameworkConfig(config);
    }
}

export class PluginFrameworkBuilder {
    constructor(private builder: Builder) {}
    async compile(source: string, data: any) {
        return await this.builder.compile(source, data);
    }
}
export class PluginFrameworkFS {
    constructor(private fs: FSJetpack) {}

    read(filePath: string) {
        //@todo check if read is in the current project folder not outside, security
        return this.fs.read(filePath);
    }
    write(filePath: string, data: string) {
        //@todo check if write is in the current project folder not outside, security
        return this.fs.write(filePath, data);
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
        return this.config[name];
    }
}
