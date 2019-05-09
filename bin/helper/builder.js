"use strict";
exports.__esModule = true;
var path_1 = require("./path");
var Builder = (function () {
    function Builder(templateEngine, fs, fileData, options) {
        if (options === void 0) { options = null; }
        this.templateEngine = templateEngine;
        this.fs = fs;
        this.data = null;
        this.template = '';
        this.defaultTemplate = 'theme/default.hbs';
        this.data = fileData;
        if (options != null) {
            this.data = Object.assign(options, fileData);
        }
        this.path = new path_1.Path();
    }
    Builder.prototype.validate = function () {
        return this.data != null;
    };
    Builder.prototype.loadTemplate = function () {
        console.log('');
        if (this.data.page != null) {
            var path = this.fs.path(this.path.dir(this.data.source), this.data.page);
            if (!this.fs.exists(path)) {
                console.error("template \"" + this.data.page + "\" could not be found for \"" + this.data.source + "\", fallback to \"" + this.defaultTemplate + "\"");
                return this.fs.read(this.defaultTemplate);
            }
            var html = this.fs.read(path);
            console.log(this.data.page);
            console.log(path);
            console.log(html);
            return html;
        }
    };
    Builder.prototype.generate = function () {
        var templateSource = this.loadTemplate();
        var template = this.templateEngine.compile(templateSource);
        return template(this.data);
    };
    return Builder;
}());
exports.Builder = Builder;
//# sourceMappingURL=builder.js.map