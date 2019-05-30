import { Logger } from './logger';
export class Events {
    constructor(private logger: Logger) {
        if (!global) {
            console.error('can not create events');
            return;
        }
        if (!global.hasOwnProperty('wyvr')) {
            //console.log('no wyvr');
            (<any>global).wyvr = {};
        }
        if (!(<any>global).wyvr.hasOwnProperty('events')) {
            //console.log('no events');
            (<any>global).wyvr.events = {};
        }
        //console.log('events ready');
    }
    pub(name: string, data: any = null) {
        if (global && name) {
            const keys = Object.keys((<any>global).wyvr.events);
            const event = keys.find((k) => k === name);
            if (event) {
                const methods = (<any>global).wyvr.events[name];
                if (typeof methods == 'function') {
                    this.logger.debug(this, `publish event "${name}" with 1 event subscriber`);
                    methods(data);
                }
                if (typeof methods == 'object' && methods.length > 0) {
                    this.logger.debug(this, `publish event "${name}" with ${methods.length} event subscribers`);
                    methods.map((m: Function) => {
                        if (typeof m == 'function') {
                            m(data);
                        }
                    });
                }
            }
        }
    }
    sub(name: string, callback: Function) {
        if (global && name) {
            this.logger.debug(this, `subscribe to event "${name}"`);
            if(!(<any>global).wyvr.events[name]) {
                (<any>global).wyvr.events[name] = [];
            }
            (<any>global).wyvr.events[name].push(callback);
        }
    }
    unsub() {}
}
