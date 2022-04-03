'use strict';

define([], function () {
    return function (Config) {
        class Logger {
            private widgetSignature: string;

            constructor() {
                if (!Logger["instance"]) {
                    Logger["instance"] = this;
                }
                this.widgetSignature = `[${Config.widget.ver}] `;
                this.show('Виджет запущен');

                return Logger["instance"];

            }

            styleThis = (background, color) => {
                return [
                    `background: ${background} `,
                    'border-radius: 2px',
                    `color: ${color}`,
                    'font-size: 11px',
                    'font-weight: bold',
                    //'padding: 2px 3px',
                ].join(';');
            };
            /*Еще вариант
            * https://dev.to/maxbvrn/extend-console-s-methods-without-losing-line-information-2d68
            * */

            showLog = console.log.bind(console, '%c %s', this.styleThis('darkgreen', 'white'));
            showDev = console.info.bind(console, '%c %s', this.styleThis('orange', 'black'));
            showTrace = console.trace.bind(console, '%c %s', this.styleThis('red', 'black'));

            //TODO сделать таймер операций
            show(message, ...args) {
                this.showLog(`🐱${this.widgetSignature}${message}`, ...args);
            };

            trace(message, ...args) {
                this.showTrace(`💥${this.widgetSignature}${message}`, ...args);
            };

            error(message, ...args) {
                const style = this.styleThis('red', 'black');
                this.error = Function.prototype.bind.call(console.info, console, '%c %s', style, `😡${this.widgetSignature}`);
                if (args.length !== 0) {
                    this.error.call(message, args);
                }

            };

            dev(message, ...args) {
                if (Config.debug) {
                    const style = this.styleThis('orange', 'black');
                    this.dev = Function.prototype.bind.call(console.table, console, '%c %s', style, `🚧${this.widgetSignature}`);
                    if (args.length !== 0) {
                        this.dev.call(message, args);
                    }

                }
            };

        }

        return new Logger;
    };

});