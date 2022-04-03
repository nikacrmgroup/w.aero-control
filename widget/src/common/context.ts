'use strict';
//import $$ = require('jquery');
define([
    'jquery', 'underscore', '../custom.js', '../libs/amoSettings.js',
    '../libs/amoPrivateApi.js'], function ($, _, Custom, AmoSettings, AmoPrivateApi) {
    return function (widget, config, logger, templater) {

        class Context {
            get mappingById(): any[] {
                return this._mappingById;
            }

            set mappingById(value: any[]) {
                this._mappingById = value;
            }

            get mappingByCode(): any[] {
                return this._mappingByCode;
            }

            set mappingByCode(value: any[]) {
                this._mappingByCode = value;
            }

            public readonly widget: object;
            public readonly config: object;
            public logger: object;
            public templater: object;
            public leadId: any;
            public leadModel: any;
            public leadResponsibleName: any;
            public amoCfValues: any;
            public contactName: any;
            public preparedAmoCfValues: any;
            public preparedParams: any;
            public product: any;
            private readonly settings: {}[];
            public readonly fieldNames: any;
            public _mappingByCode: any[];
            public _mappingById: any[];
            public deletedFields: {};

            constructor() {
                if (!Context["instance"]) {
                    Context["instance"] = this;
                }
                this.widget = widget;
                this.config = jQuery.extend(true, {}, config);
                this.logger = logger;
                this.templater = templater;
                this.leadId = {values: 'need to be requested'};
                this.leadModel = {values: 'need to be requested'};
                this.leadResponsibleName = {values: 'need to be requested'};
                this.amoCfValues = {values: 'need to be requested'};
                this.contactName = {values: 'need to be requested'};
                this.preparedAmoCfValues = {values: 'need to be prepared'};
                this.preparedParams = {values: 'need to be prepared'};
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
                //self.leadResponsibleName = Custom.getResponsibleName(self.leadModel);
                self.preparedAmoCfValues = Custom.prepareAmoCfValues(self.amoCfValues);
                //this.product = Custom.getProduct(this.amoCfValues, this.preparedAmoCfValues, this.mappingByCode);
                self.preparedParams = Custom.prepareParams(self.amoCfValues, self._mappingById, self.preparedAmoCfValues);
                //this.deletedFields = JSON.parse(Custom.getFieldValue('deleted_fields'));
                //this.companyFields = await Custom.getCompanyFields(['name', 'ИНН']);
                //this.contactName = this.companyFields['name'];
                //this.contactInn = this.companyFields['ИНН'];
                //this.contactName = await Custom.getContactName();
                //this.companyName = await Custom.getCompanyName();

            };



        }

        return new Context();
    };

});