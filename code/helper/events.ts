export class Events {
    constructor() {
        if (!global) {
            console.error('can not create events');
            return;
        }
        if (!global.hasOwnProperty('deve')) {
            //console.log('no deve');
            (<any>global).deve = {};
        }
        if (!(<any>global).deve.hasOwnProperty('events')) {
            //console.log('no events');
            (<any>global).deve.events = {};
        }
        //console.log('events ready');
    }
    pub(name: string, data: any = null) {
        if (global && name) {
            const keys = Object.keys((<any>global).deve.events);
            const event = keys.find((k) => k === name);
            if (event) {
                const methods = (<any>global).deve.events[name];
                if (typeof methods == 'function') {
                    methods(data);
                }
                if (typeof methods == 'object' && methods.length > 0) {
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
            if(!(<any>global).deve.events[name]) {
                (<any>global).deve.events[name] = [];
            }
            (<any>global).deve.events[name].push(callback);
        }
    }
    unsub() {}
}
