'use strict';
declare var define: any
define([
      'underscore',
      'jquery',
      '../libs/amoSettings.js',
      '../libs/amoPrivateApi.js',
      './custom.js',
      './common/container.js'],
    function(_, $, AmoSettings, AmoPrivateApi, Custom, Container) {
      // @ts-ignore

      return {
        // noinspection JSPotentiallyInvalidUsageOfThis

        logger: () => {
          return Container.getLogger();
        },
        // @ts-ignore
        run: async function(params = []) {
          const routeDetailsTableCode = this.generateRouteDetailsTable(params);
          const routeInfoTableCode = this.generateInfoTable(params);
          let routeCostTableCode = this.generateCostTable(params);
          let jQueryRouteTable = $('<div/>').append(routeCostTableCode);
          let trOdds = jQueryRouteTable.find('tr:odd');
          trOdds.each(function() {
            if ($(this).not('[colspan=2]')) {
              $(this).css({'background': '#e8e8e8', 'color': 'black'});
            }
          });
          /*Включение зебры  с заливкой в таблице*/
          //routeCostTableCode = jQueryRouteTable.html();
          const marioTableCode = this.generateMarioTable(params);
          const widget = Container.getContext().widget;
          const settings = Custom.getSettings();
          const fieldNames = Custom.getFieldNames();
          const mappingByCode = Custom.getMapping(settings, fieldNames, 'by_code');


          const fieldsUpdate = [
            {
              id: mappingByCode['route_details_table_code'].id,
              value: routeDetailsTableCode,
            },
            {
              id: mappingByCode['delivery_route_table_code'].id,
              value: marioTableCode,
            },
            {
              id: mappingByCode['cost_table_code'].id,
              value: routeCostTableCode,
            },
            {
              id: mappingByCode['info_table_code'].id,
              value: routeInfoTableCode,
            },
            {
              id: mappingByCode['total_with_commission'].id,
              value: $('#step-3-form #table-total .total-field-value').val(),
            },
          ];

          Custom.updateLeadFields(fieldsUpdate);

        },

        /**
         * ДЕТАЛИ МАРШРУТА И ТРАНЗИТА
         *
         */
        generateRouteDetailsTable: function(params) {
          const that = this;
          /*Адрес отправления данные подставляются с поля "адрес отправителя" если стоит флаг в поле
           "Экспедирование в пункте отправления",
           "pickup_address": "Адрес забора груза",
            "forwarding_departure_need": "Экспедирование в пункте отправления"
           */

          const departurePoint = params.common.pickup_address.value;
          let departurePointRow = '';
          if (params.common['forwarding_departure_need'].value === 'Да') {
            departurePointRow = that.renderSpan(['Адрес отправления', departurePoint]);
          }
          /*Адрес назначения	данные подставляются с поля "адрес получателя" если стоит флаг в поле "Экспедирование в пункте назначения"
            "shipping_address": "Адрес доставки груза",
            "forwarding_destination_need": "Экспедирование в пункте назначения"
         */
          const destinationPoint = params.common['shipping_address'].value;
          let destinationPointRow = '';
          if (params.common['forwarding_destination_need'].value === 'Да') {
            destinationPointRow = that.renderSpan(['Адрес назначения', destinationPoint]);
          }

          /*Ориентировочный срок доставки, данные подставляются с поля "Авиа, срок"
          *  "delivery_period": "Срок доставки",
          * */
          const deliveryPeriod = params.common['delivery_period'].value;
          const deliveryPeriodRow = that.renderSpan(['Ориентировочный срок доставки', deliveryPeriod]);

          /*Вылеты , данные подставляются с поля "Вылеты"
          *   "departures": "Вылеты",
          * */
          let departuresRow = '';
          const departuresItems = params.common['departures'].items;
          let departuresArray = [];
          if (departuresItems) {
            // @ts-ignore
            const departuresItemsConverted = Object.values(departuresItems);
            departuresItemsConverted.forEach(item => {
              if (item['is_checked']) {
                departuresArray.push(item.option);
              }
            });
            const departuresString = departuresArray.join(', ');
            departuresRow = that.renderSpan(['Вылеты', departuresString]);
          }

          const result = ` ${departurePointRow}${destinationPointRow}${deliveryPeriodRow}${departuresRow}`;

          return result;
        },
        /**
         * ДАННЫЕ ПО ГРУЗУ
         */
        generateInfoTable: function(params) {
          const that = this;
          /*

слово "Опасность" подставляется если в поле "Опасность" стоит флаг и следом подставляется комментарий из поля "Коммент. к опасности"
Словосочетание "Темп. режим" подставляется если в поле "Темп. режим." стоит флаг, 0 +2 подставляется из поля "Коммент. к режиму"
          *
          * */
          /* "cargo_type": "Тип груза",*/
          const cargoType = params.common['cargo_type'].value;
          const cargoTypeRow = that.renderSpan(['Тип груза', cargoType]);
          /*
          *  "cargo_name": "Наименование груза",
          * */
          const cargoName = params.common['cargo_name'].value;
          const cargoNameRow = that.renderSpan(['Наименование груза', cargoName]);

          /*
          *  "cargo_cost": "Стоимость груза",
          * */
          const cargoCost = params.common['cargo_cost'].value;
          const cargoCostRow = that.renderSpan(['Стоимость груза', cargoCost]);
          /*
           "packaging_need": "Тип упаковки",
          * */
          const packagingNeed = params.common['packaging_need'].value;
          let packagingNeedRow = '';
          if (packagingNeed !== 'Требуется упаковка') {
            packagingNeedRow = that.renderSpan(['Тип упаковки', packagingNeed]);
          }

          /*
            "heavyweight": "Тяжеловес",
          * */
          const heavyweight = params.common['heavyweight'].value;
          let heavyweightRow = '';
          if (heavyweight === 'Да') {
            heavyweightRow = that.renderSpan(['Тяжеловесный', heavyweight]);
          }
          /*
          * слово "Опасность" подставляется если в поле "Опасность" стоит флаг и следом подставляется комментарий из поля "Коммент. к опасности"
          *   "danger": "Опасный",
      "danger_comment": "Коммент. к опасности",
          * */
          const danger = params.common['danger'].value;
          let dangerRow = '';
          if (danger === 'Да') {
            const dangerComment = params.common['danger_comment'].value;
            dangerRow = that.renderSpan(['Опасность', dangerComment]);
          }

          /*
          * Словосочетание "Темп. режим" подставляется если в поле "Темп. режим." стоит флаг, 0 +2 подставляется из поля "Коммент. к режиму"
          *       "temp_mode": "Темп. режим",
      "mode_comment": "Коммент. к режиму",
          *
          * */
          const tempMode = params.common['temp_mode'].value;
          let tempModeRow = '';
          if (tempMode === 'Да') {
            const modeComment = params.common['mode_comment'].value;
            tempModeRow = that.renderSpan(['Темп. режим', modeComment]);
          }

          const htmlTable = `<table><tr><td style="width: 29.33333396911621px;">&nbsp;</td><td  style="vertical-align: top; width: 384.5416564941406px;" colspan="3">${cargoTypeRow}${cargoNameRow}${cargoCostRow}${packagingNeedRow}</td> <td style="width: 0.8958333134651184px;">&nbsp;</td><td style="vertical-align: top" colspan="2">${heavyweightRow}${dangerRow}${tempModeRow}</td></tr></table>`;
          return htmlTable;

        },
        /**
         * СТОИМОСТЬ
         */
        generateCostTable: function(params) {
          const that = this;

          const arrival = params.tables['arrival'];
          const delivery = params.tables['delivery'];
          const extra = params.tables['extra'];
          const total = params.tables['total'];
          let arrivalHtml = that.getCostTableRows(arrival, arrival.currency, params);
          if (arrivalHtml !== '') {
            arrivalHtml = `${that.renderColSpan('до пункта прилета')}${arrivalHtml}${that.renderTd(
                ['ВСЕГО ДО ПУНКТА НАЗНАЧЕНИЯ', arrival.total, arrival.currency], 'font-weight: bold;')}`;
          }
          let deliveryHtml = that.getCostTableRows(delivery, delivery.currency);
          if (deliveryHtml !== '') {
            deliveryHtml = `${that.renderColSpan('доставка')}${deliveryHtml}${that.renderTd([
              'ВСЕГО ДОСТАВКА', delivery.total,
              delivery.currency], 'font-weight: bold;')}`;
          }
          let extraHtml = that.getCostTableRows(extra, extra.currency);
          if (extraHtml !== '') {
            extraHtml = `${that.renderColSpan('дополнительные услуги')}${extraHtml}${that.renderTd(
                ['ВСЕГО ДОП УСЛУГИ', extra.total, extra.currency], 'font-weight: bold;')}`;
          }

          const htmlTable = `<table style="border-spacing:0;border-collapse:collapse;border:1px solid #999" ><tbody>${arrivalHtml}${deliveryHtml}${extraHtml}</tbody></table>`;

          return htmlTable.trim();
        },

        generateMarioTable: function(params) {
          const firstStage = params.common['auto_route_a1'].value;
          const finalStage = params.common['auto_route_b2'].value;
          const aeroStages = [
            params.common['air_route_1'].value,
            params.common['air_route_2'].value,
            params.common['air_route_3'].value,
            params.common['air_route_4'].value,
            params.common['air_route_5'].value,
            params.common['air_route_6'].value,
            params.common['air_route_7'].value,
          ];
          let imageRow = `<span style="margin-bottom: 15px; display: block;">`;
          /*Если город есть, то машинку рисовать нужно*/
          if (firstStage !== '') {
            imageRow += this.carImg('margin-right:30px;');
          }
          else {
            /*Иначе - заглушка*/
            imageRow += `<span style="display: inline-block; height:50px;margin-right:30px; width: 43px; vertical-align: bottom;">&nbsp;</span>`;
          }
          const spanCityStyle = `border-radius: 10px; background: white; border: 2px solid #008dd2; padding: 20px 10px;`;
          let spanHopStyle = `border-radius: 50%; margin: 0 10px;  background: white; border: 2px solid #008dd2; padding: 20px 15px;`;
          let stagesStyleModifier = '';

          let borderRadiusStyle = '';

          /*Если нет первого города, то паддинг левый - 0*/
          if (firstStage === '') {
            stagesStyleModifier = ' padding-left: 0; margin-left: 30px;';
            borderRadiusStyle = 'border-radius: 50px 0 0 50px;';
          }
          /*Если нет последнего города, то паддинг правый - 0*/
          if (finalStage === '') {
            stagesStyleModifier += ' padding-right: 0; margin-right: 30px;';
            borderRadiusStyle = 'border-radius: 0 50px 50px 0;';
          }
          /*Если нет и первого и последнего города*/
          if (finalStage === '' && firstStage === '') {
            borderRadiusStyle = 'border-radius:  50px;';
          }
          let aeroStagesCode = `<span style="background: #008dd2; text-align: center; display: block; padding: 5px 26px;  ${stagesStyleModifier}${borderRadiusStyle}">`;
          const aeroStagesLength = aeroStages.length;

          for (let i = 0; i < aeroStagesLength; i++) {
            let stage = aeroStages[i];
            let spanHopStyleModifier = '';
            if (stage !== '') {
              /*Если последний этап самолета и нет последнего города, то меняем маржин*/
              if ((i === aeroStagesLength - 1 || aeroStages[i + 1] === '') && finalStage === '') {
                spanHopStyleModifier = ' margin-right: 0;';
              }
              /*Если первый этап самолета и нет первого города, то меняем маржин*/
              if (i === 0 && firstStage === '') {

                spanHopStyleModifier += ' margin-left: 0;';
              }
              aeroStagesCode += `<span style="${spanHopStyle}${spanHopStyleModifier}">${stage}</span>`;
              if (i !== aeroStagesLength - 1 && aeroStages[i + 1] !== '') {
                //aeroStagesCode += this.planeImg();
                imageRow += this.planeImg();
              }
            }
          }
          aeroStagesCode += `</span>`;
          /*Если город есть, то машинку рисовать нужно*/
          if (finalStage !== '') {
            imageRow += this.carImg('margin-left:30px;');
          }
          else {
            /*Иначе - заглушка*/
            imageRow += `<span style="display: inline-block; height:50px;margin-left:30px; width: 43px; vertical-align: bottom;">&nbsp;</span>`;
          }
          imageRow += `</span>`;

          return `<span style="${spanCityStyle}">${firstStage}</span><span style="display: inline-block">${imageRow}${aeroStagesCode}</span><span style="${spanCityStyle}">${finalStage}</span>`;
        },

        renderColSpan: function(value) {
          return `<tr><td colspan="2" style="background: #008dd2; color: white; font-size: 0.8em">${value}</td></tr>`;
        },

        getCostTableRows: function(table, currency, params = []) {
          let html = '';
          currency = !currency ? '' : currency;
          const that = this;
          if (table) {
            table.rows.forEach(row => {
              let dimension = '';
              if (row.value !== undefined) {
                // @ts-ignore
                if (row.code === 'air_fare' && params.common['commission_type'].value === 'кг') {
                  // @ts-ignore
                  dimension = '/' + params.common['commission_type'].value;

                }
                if (row.code === 'terminal_handling_arrival' || row.code === 'terminal_handling_departure') {
                  //Не нужно DEV-256
                  //dimension = '/кг';

                }
                const formattedValue = Custom.formatFloat(row.value);
                html += that.renderTd([row.title, formattedValue, currency + dimension]);
              }

            });
          }

          return html;
        },

        /**
         * Рендерим строку таблицы, где первый td - имя строки, второй - ее значение
         * @param values Массив строк для td
         * @param params Доп. параметры отображения в стили
         * @param color Цвет для строки
         * @returns {string}
         */
        renderRow(values, params = '', color = false) {

          params = !params ? '' : params;
          values = !values ? [] : values;
          let style = '';
          if (color) {
            style += 'background: ' + color + ';';
          }
          let spans = '';
          values.forEach(value => {
            spans += `<span>${value}</span>`;
          });
          const row = `<div style="${style}"  ${params} >${spans}</div>`;
          return row;
        },
        renderSpan(values) {
          let result = '';
          /*Если значение не пустое*/
          if (values[1] !== '') {
            const innerSpan = `${values[0]}: <span style="color: #000;">${values[1]}</span> ${values[2] || ''}`;
            result = `<div style="font-size: 12pt; font-family: Tahoma; color: #666666;" >${innerSpan}</div>`;
          }

          return result;
        },
        renderTd(values, styles) {
          styles = !styles ? '' : styles;
          let result = '';
          /*Если значение не пустое*/
          if (values[1] !== '') {
            const dimension = values[2] ? `${values[2]}` : '';
            const valueTd = `<td style="padding:1px; font-size: 0.9em; white-space: nowrap; border: 1px solid #999;">${values[1]} ${dimension}</td>`;
            result = `<tr style="${styles} " ><td  style="padding:1px; border: 1px solid #999; font-size: 0.9em;">${values[0]}</td>${valueTd}</tr>`;
          }

          return result;
        },

        planeImg: function() {
          return '<img style=" height: 50px; margin: 0 17px; "' +
              ' src="http://skycargoservice.com/img/plane.png"/>';
          //' src="https://dev.n1k.cc/assets/plane.png"/>';

        },

        carImg: function(style) {
          return `<img style="height: 50px; ${style}"  src="http://skycargoservice.com/img/car.png"/>`;
        },

      };
    });