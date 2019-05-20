export class CliStartupConfiguration {
    useWatcher: boolean = false;
    useStartupBuild: boolean = false;
    useIndexer: boolean = false;

    constructor(args: any) {
        if (args == null) {
            return this;
        }
        this.useWatcher = args.hasOwnProperty('watch');
        this.useStartupBuild = args.hasOwnProperty('build');
        this.useIndexer = args.hasOwnProperty('indexer');
    }
}
