'use strict';
define([], function () {
    return function (widget) {
        class Loader {
            settings;
            constructor() {
                if (!Loader["instance"]) {
                    Loader["instance"] = this;
                }
                this.settings = widget.get_settings();
                return Loader["instance"];
            }
            css = (styleName = 'style.min.css') => {
                const styleHref = `${this.settings.path}/css/${styleName}?v=${this.settings.version}`;
                const styleQuery = `link[href="${styleHref}"`;
                const styleLink = document.querySelector(styleQuery);
                if (styleLink === null) {
                    const newLink = document.createRange().createContextualFragment(`<link href="${styleHref}" type="text/css" rel="stylesheet">`);
                    const head = document.querySelector('head');
                    head.prepend(newLink);
                }
            };
            js = (scriptHref, scriptType = 'external') => {
                if (scriptType === 'internal') {
                    scriptHref = `${this.settings.path}/js/${scriptHref}?v=${this.settings.version}`;
                }
                const scriptQuery = `script[src="${scriptHref}"`;
                const scriptLink = document.querySelector(scriptQuery);
                if (scriptLink === null) {
                    const newLink = document.createRange().createContextualFragment(`<script type="text/javascript" charset="utf-8" async src="${scriptHref}"></script>`);
                    const head = document.querySelector('head');
                    head.appendChild(newLink);
                }
            };
        }
        return new Loader();
    };
});
