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

    call(name: string, data: any) {
        const hooks = this.get(name);
        hooks.map(async (hook)=> {
            await hook(data);
        });
    }
}
