'use strict';
define([
    './common/container.js',
    './common/bootstrap_main.js',
    './settings.js',
    './caption.js',
    './custom.js',
    './common_block.js',
    './control_block.js',
    './form.js',
    './utils.js'
], function (Container, bootstrapMain, SettingsClass, CaptionClass, CustomClass, CommonBlockClass, ControlBlockClass, FormClass, WidgetUtils) {
    return function (_widget) {
        bootstrapMain(_widget);
        Container.set('widget_utils', function (c) {
            return new WidgetUtils();
        });
        Container.set('custom', function (c) {
            return new CustomClass(c.getWidget(), c.getTemplater(), c.getLogger());
        });
        Container.set('common_block', function (c) {
            return new CommonBlockClass(c.getContext());
        });
        Container.set('control_block', function (c) {
            return new ControlBlockClass(c.getWidget(), c.getLogger(), c.getContext(), c.getTemplater());
        });
        Container.set('caption', function (c) {
            return new CaptionClass(c.getContext(), c.getForm());
        });
        Container.factory('form', function (c) {
            return new FormClass(c.getWidget(), c.getLogger(), c.getTemplater(), c);
        });
        Container.factory('settings', function (c, $modal_body) {
            return new SettingsClass($modal_body, c.getWidget(), c.getTemplater(), c.getLogger(), c.getConfig());
        });
    };
});
