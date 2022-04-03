'use strict';

define([
      'jquery',
      './libs/amoSettings.js',
      './libs/amoPrivateApi.js',
      './utils.js',
      './libs/amoDictionary.js',
      'underscore',
    ],
    function($, AmoAccount, Api, Utils, Dictionary, _) {
      return function(_$modal_body, _widget, _templater, _logger, _config) {

        this.render = function() {
          let ctx = this;
          ctx.settings = this.getSettings();
          _logger.show('Настройки рендерятся');
          this.prepareModal(ctx);
          this.renderModal(ctx).then(function() {
            _logger.show('Настройки отображены!');
          });
        };

        this.renderModal = async function(ctx) {
          await this.renderFieldsMapping(ctx);

        };

        this.prepareModal = function(ctx) {

          _$modal_body.find(
              '.widget_settings_block__item_field:last').
              after(`<div class="nika-${_config.widget.name}-settings-wrapper">
                  <div class="mapping"></div></div>`);

          ctx.$wrapper = $(`.nika-${_config.widget.name}-settings-wrapper`);
          ctx.$mappingWrapper = $('.mapping', ctx.$wrapper);

        };

        this.renderFieldsMapping = function(ctx) {
          /*Получаем копию всех полей*/
          let amoFields = $.extend(true, {}, AmoAccount.cfAll());
          amoFields = Object.values(amoFields);

          _logger.show('Получены поля amo', amoFields);
          if (amoFields) {
            /*Получаем имена полей калькулятора*/
            let amoFieldsFormatted = [];
            const fieldDesc = {
              id: 'n-first-select',
              name: `n-first-select`,
              value: `Выберите поле`,
            };
            amoFieldsFormatted.push(fieldDesc);
            amoFields.forEach(function(field, index) {
              let fieldItem = {
                id: field.ID,
                name: `n-cf-${field.ID}`,
                value: `${field.NAME} #${field.ID}`,
              };
              amoFieldsFormatted.push(fieldItem);
            });

            const reportFields = _config.mapping;

            /*Подготавливаем для рендера маппинг. Если элемент из настроек
             имеет ###  то  это элемент маппинга*/
            let mapping = {};
            if (Array.isArray(ctx.settings) && ctx.settings.length) {
              ctx.settings.forEach(function(element) {
                if (element.includes('###')) {
                  let mappedField = element.split('###');
                  mapping[mappedField[0]] = mappedField[1];
                }

              });
            }

            const templateParams = {
              amoFieldsFormatted,
              reportFields,
              mapping: mapping,
            };
            _templater.render('fields_mapping',
                function(template, base_params) {
                  ctx.$mappingWrapper.html(
                      template.render(
                          $.extend({}, base_params, templateParams, {})));
                  ctx.addSaveEvents(ctx);
                });
          }
          else {
            _logger.error('Ошибка получения полей!', amoFields);
          }
        };

        this.addSaveEvents = function(ctx) {
          const that = this;
          let nika_update_settings = function(e) {
            that.save();
          };
          ctx.$wrapper.find('input').
              on('click, controls:change', nika_update_settings);
        };
        this.save = function() {
          _logger.show('Сохраняем...');

          const code = _config.widget.code;
          const $storageField = $(`#${code}_custom`, _$modal_body);
          const $checkedInputs = $(`.nika-${_config.widget.name}-settings-wrapper input:checked`,
              _$modal_body);
          let storage = [];
          $checkedInputs.each(function(key, value) {
            storage.push($(value).attr('name'));
          });

          const $mappedFields = $('.nika-mapping-field input', _$modal_body);
          //storage.mapping = {};
          $mappedFields.each(function(key, value) {
            let fieldName = $(value).attr('name');
            let fieldValueId = $(value).attr('data-value-id');
            /*Проверяем, не первый ди это элемент списка, который по-умолчанию*/
            if (fieldValueId !== 'n-first-select') {
              //storage.mapping[fieldName] = fieldValueId;
              storage.push(`${fieldName}###${fieldValueId}`);
            }
          });
          let storageObject = Object.assign({}, storage);
          const storageString = JSON.stringify(storageObject);

          $storageField.val(storageString).trigger('change');

        };

        this.getSettings = function() {
          const allSettings = _widget.get_settings();
          let settings = allSettings.storage;

          if (settings !== undefined) {
            if (Array.isArray(settings)) {
              _logger.dev('массив с настройками settings...', settings);

            }
            else if (Utils.isJsonString(settings)) {
              settings = Object.values(JSON.parse(settings));
            }
            else if (settings.constructor === Object) {
              _logger.dev('Настройки это объект', settings);
            }

          }
          else {
            _logger.dev('Настройки пусты...', settings);
            settings = [];
          }

          return settings;
        };

      };
    });

