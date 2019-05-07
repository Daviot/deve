"use strict";
exports.__esModule = true;
var cli_1 = require("./helper/cli");
var glob = require('glob');
var fs = require('fs-jetpack');
var ora = require('ora');
var c = require('ansi-colors');
var cli = new cli_1["default"]();
var spinner = ora();
var time = new Date();
spinner.start(c.dim("[" + cli.getDate(time) + "] ") + "Waiting for changes");
setTimeout(function () {
    spinner.info('Changes detected');
    spinner.start('Building');
}, 2000);
setTimeout(function () {
    spinner.succeed('Builded succeeded');
}, 4000);
//# sourceMappingURL=index.js.map