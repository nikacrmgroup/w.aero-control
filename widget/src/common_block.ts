'use strict';

define(
    ['underscore', 'jquery', './libs/amoSettings.js', './libs/amoPrivateApi.js', './custom.js'],
    function (_, $, AmoSettings, AmoPrivateApi, Custom) {
        return function (_context) {

            class CommonBlock {

                getParams = async () => {
                    /*Получаем маппинг для общей формы.
                    * Получаем данные для этих полей из амо.
                    * Готовим параметры для шаблона.
                    * */
                    const settings = _context.settings;
                    if (settings.length === 0) {
                        _context.logger.error('Пустые настройки виджета. Останов');
                        return;
                    }

                    const amoCfValues = _context.amoCfValues;

                    if (amoCfValues) {
                        let params = _context.preparedParams;
                        //params.contact_name = contactName;
                        //params.contact_inn = contactInn;
                        //params.report_responsible = responsibleName;
                        //params.shipment_number = shipmentNumber;
                        params.product = _context.product;
                        //params.title = _context.widget.i18n('text')['form_1_title'];
                        params.version = _context.widget.get_settings().version;
                        /*       if ('report_url' in params) {
                                 params.report_url['disabled'] = true;
                                 params.report_url['placeholder'] = 'Отчет не сформирован';
                               }*/
                        return params;
                    }
                    return false;
                };

                /**
                 * Добавляем события на элементы, кнопки шага формы
                 */
                addEvents = () => {

                };
            }

            return new CommonBlock();

        };
    });