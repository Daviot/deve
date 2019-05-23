export class CliStartupConfiguration {
    useWatcher: boolean = false;
    useStartupBuild: boolean = false;
    useIndexer: boolean = false;
    environment:string = null;

    constructor(args: any) {
        if (args == null) {
            return this;
        }
        if(args.hasOwnProperty('env')) {
            this.environment = args.env;
        }
        this.useWatcher = args.hasOwnProperty('watch');
        this.useStartupBuild = args.hasOwnProperty('build');
        this.useIndexer = args.hasOwnProperty('indexer');
    }
}
