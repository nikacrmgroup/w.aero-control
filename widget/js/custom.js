'use strict';
define([
    'underscore',
    'jquery',
    'moment',
    './libs/amoSettings.js',
    './libs/amoPrivateApi.js',
    './common/container.js',
    './utils.js',
], function (_, $, moment, AmoSettings, AmoPrivateApi, Container, Utils) {
    class Custom {
        constructor() {
            if (!Custom["instance"]) {
                Custom["instance"] = this;
                return Custom["instance"];
            }
        }
        logger = () => {
            return Container.getLogger();
        };
        context = () => {
            return Container.getContext();
        };
        getFieldNames = () => {
            return Object.assign({}, Container.getContext().config.mapping);
        };
        getMapping = function (settings, fieldNames, keyType) {
            let mapping = [];
            if (!Array.isArray(settings)) {
                return [];
            }
            settings.forEach((mappedField) => {
                if (mappedField.includes('###')) {
                    let fieldArr = mappedField.split('###');
                    let fieldCode = fieldArr[0];
                    let fieldId = fieldArr[1];
                    let arrayKey = (keyType === 'by_code') ? fieldCode : fieldId;
                    if (fieldNames[fieldCode]) {
                        mapping[arrayKey] = {
                            id: fieldId,
                            code: fieldCode,
                            name: fieldNames[fieldCode],
                        };
                    }
                }
            });
            return mapping;
        };
        getAmoCfValues = async function (leadModel) {
            const response = leadModel;
            if (response['_embedded']['items']['0']) {
                const lead = response['_embedded']['items']['0'];
                let cfs = lead.custom_fields;
                if (!_.isEmpty(cfs)) {
                    let cfsPrepared = [];
                    cfs.forEach((cf) => {
                        cfsPrepared[cf.id] = cf;
                    });
                    return cfsPrepared;
                }
                this.logger().error('Пустые поля у сделки. Что с ней делать? Не понятно)');
            }
            else {
                this.logger().error();
            }
            return false;
        };
        getFieldValue = (code) => {
            let value = '[]';
            try {
                const fieldId = Container.getContext().mappingByCode[code].id;
                value = Container.getContext().preparedAmoCfValues[fieldId] || '[]';
            }
            catch (e) {
                this.logger().error(e, `code: ${code}`);
            }
            return value;
        };
        getSelectedEnum = (items, option) => {
            let id = 1;
            items.forEach((item) => {
                if (item.option === option) {
                    id = item.id;
                }
            });
            return id;
        };
        getSelectedMultiEnum = (enums, options) => {
            let items = $.extend({}, enums);
            enums.forEach((enumItem, index) => {
                if (options.includes(parseInt(enumItem.id))) {
                    items[index]['is_checked'] = true;
                }
            });
            return items;
        };
        prepareParams = function (amoCfValues, mappingById, preparedAmoCfValues, disabledFields = []) {
            let params = [];
            let value;
            mappingById.forEach((field) => {
                if (preparedAmoCfValues[field.id]) {
                    value = this.modifyCfValue(field.id, preparedAmoCfValues[field.id]);
                }
                else {
                    value = '';
                }
                const fieldType = AmoSettings.getCfType(field.id);
                if (!fieldType) {
                    return;
                }
                params[field.code] =
                    {
                        id: field.id,
                        value: value,
                        name: field.name,
                        type: fieldType,
                        code: field.code,
                    };
                if (['select'].includes(fieldType)) {
                    const items = AmoSettings.getSelectCfItems(field.id);
                    params[field.code]['items'] = items;
                    params[field.code]['selected'] = this.getSelectedEnum(items, value);
                }
                if (['multiselect'].includes(fieldType)) {
                    const items = AmoSettings.getMultiSelectCfItems(field.id);
                    params[field.code]['items'] = this.getSelectedMultiEnum(items, value);
                }
                if (field.code === 'payable_weight') {
                }
                if (disabledFields) {
                }
            });
            return params;
        };
        modifyCfValue = (id, rawValue) => {
            const cfType = AmoSettings.getCfType(id);
            let value;
            switch (cfType) {
                case 'checkbox':
                    if (rawValue === '1') {
                        value = 'Да';
                    }
                    break;
                case 'multiselect':
                    value = rawValue;
                    break;
                case 'date':
                    value = moment(rawValue).format('DD.MM.YYYY');
                    break;
                default:
                    value = rawValue;
            }
            return value;
        };
        prepareAmoCfValues = (amoCfValues) => {
            let preparedData = [];
            if (!_.isEmpty(amoCfValues)) {
                amoCfValues.forEach((cf) => {
                    const cfType = AmoSettings.getCfType(cf.id);
                    if (cfType === 'multiselect') {
                        if (!Array.isArray(preparedData[cf.id])) {
                            preparedData[cf.id] = [];
                        }
                        const enums = cf.values;
                        enums.forEach((item) => {
                            preparedData[cf.id].push(item.enum);
                        });
                    }
                    else {
                        preparedData[cf.id] = cf.values[0]['value'];
                    }
                });
            }
            return preparedData;
        };
        updateLeadFields = (fieldsValues = []) => {
            const leadId = AmoSettings.leadId();
            this.logger().dev('Апдейт полей');
            if (fieldsValues) {
                const preparedForAmoCfValues = this.prepareFieldsApiParams(fieldsValues);
                AmoPrivateApi.updateLeadFieldV4(leadId, preparedForAmoCfValues, (response) => {
                    this.logger().dev(JSON.stringify(response, null, 4));
                }, (error) => {
                    this.logger().dev('error: ' + JSON.stringify(error, null, 4));
                });
            }
        };
        saveFormFields = function (btn) {
            const self = this;
            btn.trigger('button:load:start');
            const fieldsValues = self.getFormFieldsValues();
            const leadId = AmoSettings.leadId();
            if (fieldsValues) {
                const preparedForAmoCfValues = self.prepareFieldsApiParams(fieldsValues);
                AmoPrivateApi.updateLeadFieldV4(leadId, preparedForAmoCfValues, (response) => {
                    self.logger().dev(JSON.stringify(response, null, 4));
                    btn.trigger('button:load:stop');
                }, (error) => {
                    self.logger().dev('error: ' + JSON.stringify(error, null, 4));
                });
            }
        };
        generateReport = async function (btn) {
            btn.trigger('button:load:start');
            const self = this;
            await self.saveFieldsBeforeReport();
            await Container.getContext().init();
            const data = self.getReportData();
            self.updateLeadPrice(data.total_profit);
            const url = Container.getContext().config.backend_url;
            $.ajax({
                url,
                type: 'post',
                data,
                success: function (response) {
                    if (Utils.isJsonString(response)) {
                        response = JSON.parse(response);
                        if (response.status === 'success') {
                            self.writeReportUrl(response.url, response.file_path);
                        }
                        alert(response.message);
                    }
                    else {
                        alert('Ответ от сервера пришел некорректный');
                    }
                    btn.trigger('button:load:stop');
                },
            });
        };
        getCommonBlockFieldValue = function (field) {
            const value = $(`.nika-input-block .field_${field}`).val();
            return {
                value,
            };
        };
        isRequiredFilled = function ($btn) {
            let allFilled = true;
            const $form = $btn.parents('form');
            const $inputs = $form.find('input');
            $inputs.each(function () {
                let input = $(this);
                input.removeClass('required-input');
                if (input.prop('required') && input.val() === '') {
                    input.addClass('required-input');
                    input.prop('placeholder', 'Заполните поле');
                    allFilled = false;
                }
            });
            return allFilled;
        };
        getFormFieldsValues = () => {
            let fields = [];
            const $form = $(`#nika-${Container.getContext().config.widget.name}-base-form`);
            const fieldsObj = Utils.getFormData($form);
            const fieldsJson = [];
            if (fieldsObj) {
                const data = Object.entries(fieldsObj);
                data.forEach((element) => {
                    let elementArray = element[0].split('#');
                    if (element[1] !== undefined) {
                        const field = {
                            id: elementArray[1],
                            value: element[1],
                        };
                        if (!elementArray[0].includes('field-json')) {
                            fields.push(field);
                        }
                        else {
                            fieldsJson.push(field);
                        }
                    }
                });
            }
            if (fieldsJson.length > 0) {
                const controlBlockFields = this.getControlBlockFields(fieldsJson);
                fields.push(controlBlockFields);
            }
            return fields;
        };
        getControlBlockFields = function (fieldsObj) {
            let jsonFields = [];
            let preparedFields = {};
            const fieldsId = Container.getContext().mappingByCode['control_block_code'].id;
            fieldsObj.forEach(function (fieldObj) {
                const field = {
                    id: fieldObj.id,
                    value: fieldObj.value,
                };
                jsonFields.push(field);
            });
            preparedFields = {
                id: fieldsId,
                value: JSON.stringify(jsonFields),
            };
            return preparedFields;
        };
        prepareFieldsApiParams = (formFields) => {
            let data = [];
            formFields.forEach((field) => {
                const fieldType = AmoSettings.getCfType(field.id);
                const fieldStructure = AmoSettings.getFieldDataStructure(fieldType, field.id, field.value);
                if (fieldStructure !== false) {
                    data.push(fieldStructure);
                }
            });
            return data;
        };
        formatFloat = (number) => {
            return parseFloat(number).toFixed(2);
        };
        getSettings = () => {
            const settings = Container.getContext().widget.params['storage'];
            return settings ?? [];
        };
    }
    return new Custom();
});
