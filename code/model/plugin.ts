import { FSJetpack } from 'fs-jetpack/types';
import { Events } from './../helper/events';
import { Builder } from './../helper/builder';
import { Hooks } from './hooks';
export class Plugin {
    wyver: PluginFramework;
    constructor(wyver: PluginFramework) {}
}

export class PluginFramework {
    builder: any;
    hooks: Hooks;
    events: Events;
    fs: any;
    constructor(hooks: Hooks, builder: Builder, events: Events, fs: FSJetpack) {
        this.builder = new PluginFrameworkBuilder(builder);
        this.hooks = hooks;
        this.events = events;
        this.fs = new PluginFrameworkFS(fs);
    }
}

export class PluginFrameworkBuilder {
    constructor(private builder: Builder) {}
    compile(source: string, data: any) {
        return this.builder.compile(source, data);
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
}
