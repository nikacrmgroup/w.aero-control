'use strict';
define(['underscore', 'jquery', './libs/amoSettings.js', './libs/amoPrivateApi.js', './custom.js'], function (_, $, AmoSettings, AmoPrivateApi, Custom) {
    return function (_context) {
        class CommonBlock {
            getParams = async () => {
                const settings = _context.settings;
                if (settings.length === 0) {
                    _context.logger.error('Пустые настройки виджета. Останов');
                    return;
                }
                const amoCfValues = _context.amoCfValues;
                if (amoCfValues) {
                    let params = _context.preparedParams;
                    params.product = _context.product;
                    params.version = _context.widget.get_settings().version;
                    return params;
                }
                return false;
            };
            addEvents = () => {
            };
        }
        return new CommonBlock();
    };
});
