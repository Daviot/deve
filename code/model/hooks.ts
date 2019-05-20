export class Hooks {
    hooks: any = {};

    constructor() {

    }

    get(name: string): Function[] {
        if(!name) {
            return [() => {}];
        }
        const keys = Object.keys(this.hooks);
        const hooks = [...keys.filter((key)=> key == name).map((key)=> {
            return this.hooks[key];
        })];

        return hooks;
    }

    set(name: string, func: Function) {
        if(!this.hooks[name]) {
            this.hooks[name] = [];
        }
        this.hooks[name].push(func);
    }

    async call(name: string, data: any) {
        const hooks = this.get(name);
        for(let i = 0, len = hooks.length; i < len; i++) {
            data = await hooks[i](data);
        }
        return data;
    }
}
