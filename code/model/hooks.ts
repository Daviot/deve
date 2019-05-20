export class Hooks {

    constructor() {
        (<any>global).hooks = {};
    }

    get(name: string): Function[] {
        if(!name) {
            return [() => {}];
        }
        const keys = Object.keys((<any>global).hooks);
        const hasHooks = keys.find((key)=> key == name);

        if(hasHooks) {
            return (<any>global).hooks[name];
        }
        return [() => {}];
    }

    set(name: string, func: Function) {
        if(!(<any>global).hooks[name]) {
            (<any>global).hooks[name] = [];
        }
        (<any>global).hooks[name].push(func);
    }

    async call(name: string, data: any) {
        const hooks = this.get(name);
        for(let i = 0, len = hooks.length; i < len; i++) {
            if(typeof hooks[i] != 'function') {
                continue;
            }
            data = await hooks[i](data);
        }

        return data;
    }
}
