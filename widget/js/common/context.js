'use strict';
define([
    'jquery', 'underscore', '../custom.js', '../libs/amoSettings.js',
    '../libs/amoPrivateApi.js'
], function ($, _, Custom, AmoSettings, AmoPrivateApi) {
    return function (widget, config, logger, templater) {
        class Context {
            get mappingById() {
                return this._mappingById;
            }
            set mappingById(value) {
                this._mappingById = value;
            }
            get mappingByCode() {
                return this._mappingByCode;
            }
            set mappingByCode(value) {
                this._mappingByCode = value;
            }
            widget;
            config;
            logger;
            templater;
            leadId;
            leadModel;
            leadResponsibleName;
            amoCfValues;
            contactName;
            preparedAmoCfValues;
            preparedParams;
            product;
            settings;
            fieldNames;
            _mappingByCode;
            _mappingById;
            deletedFields;
            constructor() {
                if (!Context["instance"]) {
                    Context["instance"] = this;
                }
                this.widget = widget;
                this.config = jQuery.extend(true, {}, config);
                this.logger = logger;
                this.templater = templater;
                this.leadId = { values: 'need to be requested' };
                this.leadModel = { values: 'need to be requested' };
                this.leadResponsibleName = { values: 'need to be requested' };
                this.amoCfValues = { values: 'need to be requested' };
                this.contactName = { values: 'need to be requested' };
                this.preparedAmoCfValues = { values: 'need to be prepared' };
                this.preparedParams = { values: 'need to be prepared' };
                this.product = false;
                this.settings = widget.params['storage'] ?? [];
                this.fieldNames = Object.assign({}, config.mapping);
                this._mappingByCode = Custom.getMapping(this.settings, this.fieldNames, 'by_code');
                this._mappingById = Custom.getMapping(this.settings, this.fieldNames, 'by_id');
                this.deletedFields = {};
                return Context["instance"];
            }
            init = async function () {
                const self = this;
                self.leadId = AmoSettings.leadId();
                self.leadModel = await AmoPrivateApi.getLeadsById(self.leadId);
                self.amoCfValues = await Custom.getAmoCfValues(self.leadModel);
                self.preparedAmoCfValues = Custom.prepareAmoCfValues(self.amoCfValues);
                self.preparedParams = Custom.prepareParams(self.amoCfValues, self._mappingById, self.preparedAmoCfValues);
            };
        }
        return new Context();
    };
});
