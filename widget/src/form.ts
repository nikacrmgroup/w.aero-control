'use strict';

define(['jquery', 'moment', './custom.js', './utils.js'],
    function ($, moment, Custom, Utils) {
        return function (_widget, _logger, _templater, _container) {
            //TODO переместить в отдельный контейнер
            $.fn.fadeOutAndRemove = function (speed) {
                $(this).fadeOut(speed, function () {
                    $(this).remove();
                });
            };

            class Form {
                private config: any;

                constructor() {
                    this.config = _container.getConfig();

                }

                async render() {
                    const _this = this;
                    _templater.renderTwig('overlay', {widget_code: _this.config.widget.name}, function (content) {
                        $('body').append(content);
                        _this.renderForm();
                    });

                }

                async renderForm() {
                    const _this = this;
                    await _container.getContext().init();

                    const common_block_params = await _container.getCommonBlock().getParams();
                    const control_block_params = await _container.getControlBlock().getParams();

                    const templateParams = {
                        common_block_params,
                        control_block_params,
                        widget_code: _this.config.widget.name,
                        btn_text: _this.config.btn_text.init,
                        closeOption: true,

                    };
                    _templater.renderTwig('form', templateParams, function (content) {
                        $('body').append(content);
                        $(`.nika_${_this.config.widget.name}-boxes-layer`).fadeOutAndRemove('fast');
                        $(`.nika-${_this.config.widget.name}-modal__close, #nika_${_this.config.widget.name}_modal_layer`).click(function () {
                            $(`.nika-${_this.config.widget.name}-modal, #nika_${_this.config.widget.name}_modal_layer`).fadeOutAndRemove('fast');
                        });

                        _this.addEvents();
                        _this.init();

                    });
                }

                addEvents = () => {
                    _container.getCommonBlock().addEvents();
                    _container.getControlBlock().addEvents();
                    this.addSaveEvents();
                    this.addGenerateEvents();
                }

                init = () => {
                    const $generateBtn = $(`#${this.config.widget.name}_generate-button`);
                    $generateBtn.trigger('button:save:disable');
                    _container.getControlBlock().initActions();
                }


                getFieldValue = (code, cfValues) => {

                    let value = 'n/a';
                    try {
                        const fieldId = _container.getContext().mappingByCode[code].id;
                        value = cfValues[fieldId];
                    } catch (e) {
                        _logger.error(e, ` code: ${code}`);
                    }
                    return value;
                };

                addSaveEvents = () => {
                    const $saveBtn = $(`#${this.config.widget.name}_save-button`);
                    $saveBtn.on('click', function () {
                        Custom.saveFormFields($(this));
                    });

                };

                addGenerateEvents = () => {
                    const $generateBtn: JQuery = $(`#${this.config.widget.name}_generate-button`);

                    $generateBtn.on('click', function () {
                        _container.getControlBlock().generateCodeActions($(this));
                    });

                };

            }

            return new Form();

        };
    });