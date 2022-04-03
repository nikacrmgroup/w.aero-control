'use strict';
//TODO не сохраняется кастом причина

define([
        'underscore', 'jquery', './libs/amoSettings.js', './libs/amoPrivateApi.js', './custom.js', './utils.js'],
    function (_, $, AmoSettings, AmoPrivateApi, Custom, Utils) {
        return function (_widget, _logger, _context, _templater) {
            // noinspection JSPotentiallyInvalidUsageOfThis
            class ControlBlock {
                settings: {}[];
                mappingById: any;
                mappingByCode: any;
                amoCfValues: any;
                preparedAmoCfValues: any;
                preparedParams: any;
                fieldNames: any;
                enableEventsCounter: string[];
                $generateBtn: JQuery;
                private widgetName: string;

                constructor() {

                }

                /**
                 * Проверяем, если undefined пришло из поля или строка-пустой массив
                 * @param route
                 */
                normalizeRouteValue(route: string | undefined): string {

                    if (route === undefined || route === '[]') {
                        route = '';
                    }

                    return route;
                };

                /**
                 *   Получаем и формируем параметры для таблицы контроля
                 */
                getParams = async () => {
                    this.settings = _context.settings;
                    this.fieldNames = _context.fieldNames;
                    this.mappingByCode = _context.mappingByCode;
                    this.mappingById = _context.mappingById;
                    this.amoCfValues = _context.amoCfValues;
                    this.preparedAmoCfValues = _context.preparedAmoCfValues;
                    this.preparedParams = _context.preparedParams;
                    this.widgetName = _context.config.widget.name;
                    this.enableEventsCounter = [];


                    /*Получаем a1*/
                    const routeA1 = this.normalizeRouteValue(Custom.getFieldValue('auto_route_a1'));
                    /*Получаем b2*/
                    const routeB2 = this.normalizeRouteValue(Custom.getFieldValue('auto_route_b2'));
                    /*Получаем сегменты*/
                    const segments = this.getRouteSegments();
                    /*Формируем заголовок из маршрутов для таблицы*/
                    const routesHeader = this.createRoutesHeader(routeA1, segments, routeB2);
                    /*Формируем таблицу маршрута*/


                    /*Добавляем к таблице маршрутов селектор статуса*/
                    const routesRows = this.createRoutesRows(routeA1, segments, routeB2);
                    /*Заполняем шаблон таблицы сохраненными данными*/
                    const preparedRows = this.populateRoutesRows(routesRows);


                    return {
                        routesHeader,
                        causes: _context.config.causes,
                        rows: preparedRows,
                        amoFields: this.preparedParams,
                        default_background: _context.config.default_background,
                    };
                };

                populateRoutesRows = (routesRows): {}[] => {
                    const _this = this;
                    let populatedRows = [];
                    const savedValuesJson = Custom.getFieldValue('control_block_code');
                    if (Utils.isJsonString(savedValuesJson)) {
                        const savedValues = JSON.parse(savedValuesJson);
                        const savedValuesObj: {} = Utils.convertArrayToObject(savedValues, 'id');

                        routesRows.forEach(function (routeToPopulate) {
                            const name = routeToPopulate.name;
                            const populatedRow = routeToPopulate;

                            const finalStatusObj = populatedRow.statuses[populatedRow.statuses.length - 1];
                            /*Пишем последний статус для прогресс-таблицы*/
                            populatedRow['final_status_value'] = finalStatusObj.value;
                            populatedRow['final_status_id'] = finalStatusObj.id;

                            const indexName = `${name}-status`;
                            /*Проверяем статус: есть ли сохраненный*/
                            if (indexName in savedValuesObj) {
                                populatedRow['selected_status'] = savedValuesObj[indexName].value;

                                const rowStatusesObj: {} = Utils.convertArrayToObject(populatedRow.statuses, 'id');
                                const status = rowStatusesObj[savedValuesObj[indexName].value];
                                if (status !== undefined && ('value' in status)) {
                                    populatedRow['selected_status_text'] = rowStatusesObj[savedValuesObj[indexName].value].value;
                                    populatedRow['selected_status_id'] = rowStatusesObj[savedValuesObj[indexName].value].id;
                                    populatedRow['selected_status_background'] = rowStatusesObj[savedValuesObj[indexName].value].background;
                                }

                            }

                            if (![/*'a1',*/ 'b2'].includes(routeToPopulate.name)) {
                                /*Если не б2, то могут быть и дата и рейс*/

                                const populateArr = [
                                    'flight-date',
                                    'flight-number',
                                    'flight-number-cause',
                                    'flight-number-custom-cause',
                                    'flight-date-cause',
                                    'flight-date-custom-cause',
                                ];
                                populateArr.forEach(function (populateParam) {
                                    _this.populateA1B2helper(name, populateParam, savedValuesObj, populatedRow);
                                });


                            }
                            populatedRows.push(populatedRow);
                        });

                    }


                    return populatedRows;

                }
                populateA1B2helper = function (routeName: string, paramName: string, savedValuesObj: {}, populatedRow: []) {
                    const indexName = `${routeName}-${paramName}`;
                    if (indexName in savedValuesObj) {
                        paramName = paramName.replace(/-/g, "_");
                        populatedRow[paramName] = savedValuesObj[indexName].value;
                    }

                }

                createRoutesHeader = (routeA1: string, segments: { name: string, title: string }[], routeB2: string): string => {
                    const routesArr: string[] = [];
                    if (routeA1 !== '' && routeA1 !== '[]') {
                        routesArr.push(routeA1);
                    }
                    segments.forEach(function (segment) {
                        routesArr.push(segment.title);
                    });

                    if (routeB2 !== '' && routeB2 !== '[]') {
                        routesArr.push(routeB2);
                    }
                    return routesArr.join('-');
                };

                createRoutesRows(routeA1: string, segments: {}[], routeB2: string): {}[] {

                    const configSegments: [] = _context.config.segments;
                    /*
                    * Нужно вывести:
                    * описание(тип) сегмента
                    * название сегмента
                    * если это не a1 или b2, то рейс и дата рейса
                    * селектор статусов
                    *
                    * */

                    type Row = {
                        name: string,
                        title: string,
                        description: string,
                        statuses: [],
                        default_statuses: []
                    };
                    type TemplateRows = Row[];
                    type Config = {
                        default_statuses: [];
                        description: string,
                        statuses: []
                    };
                    const templateRows: TemplateRows = [];

                    if (routeA1) {
                        const config: Config = configSegments['a1'];
                        let row: Row = {
                            name: 'a1',
                            title: routeA1,
                            description: config.description,
                            statuses: config.statuses,
                            default_statuses: config.default_statuses
                        };
                        templateRows.push(row);
                    }
                    /*выводим а11 - это поле частично из конфига, самого содержимого нет, просто всегда "размещение"*/
                    {
                        const config: Config = configSegments['a11'];
                        /*если нет а1, то а11 - первый и без дефолта*/
                        let defaultStatuses = config.default_statuses;
                        if (!routeA1) {
                            defaultStatuses = config.statuses;
                        }
                        let row: Row = {
                            name: 'a11',
                            title: '',
                            description: config.description,
                            statuses: config.statuses,
                            default_statuses: defaultStatuses
                        };
                        templateRows.push(row);
                    }

                    const segmentsLastIndex: number = segments.length - 1;
                    segments.forEach(function (segment: { name: string, title: string }, index) {
                        let config: Config = configSegments['route'];

                        /*проверяем, есть ли a1, если нет, то сегмент первый*/
                        if (!routeA1 && index === 0) {
                            config = configSegments['first_route'];
                        }
                        if (segment.name === 'segment_1') {
                            config = configSegments['segment_1'];
                        }
                        /*Проверяем, если это последний сегмент*/
                        if (index === segmentsLastIndex) {
                            /*проверяем, есть ли b2, если нет, то сегмент последний*/
                            if (!routeB2) {
                                config = configSegments['last_route_wo_b2'];
                            } else {
                                config = configSegments['last_route'];
                            }
                        }

                        let row: Row = {
                            name: segment.name,
                            title: segment.title,
                            statuses: config.statuses,
                            description: config.description,
                            default_statuses: config.default_statuses
                        };
                        templateRows.push(row);


                    });

                    if (routeB2) {
                        const config: Config = configSegments['b2'];
                        let row: Row = {
                            name: 'b2',
                            title: routeB2,
                            description: config.description,
                            statuses: config.statuses,
                            default_statuses: config.default_statuses
                        };

                        templateRows.push(row);
                    }

                    return templateRows;
                }

                getCurrentRouteConfig(routeName: string, segments: {}[]) {

                    const configSegments: [] = _context.config.segments;
                    if (routeName === 'b2') {
                        return configSegments['b2'];
                    }
                    if (routeName === 'a1') {
                        return configSegments['a1'];
                    }
                    if (routeName === 'a11') {
                        return configSegments['a11'];
                    }
                    let config = configSegments['route'];

                    const segmentsLastIndex: number = segments.length - 1;
                    let notSet = true;
                    segments.forEach(function (segment: { name: string, title: string }, index) {


                        /*проверяем, есть ли a1, если нет, то сегмент первый*/
                        if (routeName !== 'a1' && segment.name === routeName && index === 0) {
                            config = configSegments['first_route'];
                            notSet = false;
                        }
                        if (notSet && segment.name === routeName && segment.name === 'segment_1') {
                            config = configSegments['segment_1'];
                            notSet = false;
                        }
                        /*Проверяем, если это последний сегмент*/
                        if (notSet && segment.name === routeName && index === segmentsLastIndex) {
                            /*проверяем, есть ли b2, если нет, то сегмент последний*/
                            if (routeName !== 'b2') {
                                config = configSegments['last_route_wo_b2'];
                            } else {
                                config = configSegments['last_route'];
                            }
                            notSet = false;
                        }


                    });


                    return config;
                }

                getRouteConfig(causedRouteName: string, nextRouteName: string, segments: {}[]) {

                    const configSegments: [] = _context.config.segments;
                    /*
                    * Нужно вывести:
                    * описание(тип) сегмента
                    * название сегмента
                    * если это не a1 или b2, то рейс и дата рейса
                    * селектор статусов
                    *
                    * */
                    const segmentsLastIndex: number = segments.length - 1;

                    if (nextRouteName === 'a1') {
                        return configSegments['a1'];

                    }
                    if (nextRouteName === 'a11') {
                        return configSegments['a11'];

                    }

                    if (nextRouteName === 'b2' || (causedRouteName === 'b2' && nextRouteName === undefined)) {

                        return configSegments['b2'];

                    }
                    if (causedRouteName === 'a11' && nextRouteName === 'segment_1') {
                        return configSegments['segment_1'];

                    }
                    const ordinaryRoutes = [
                        'segment_2',
                        'segment_3',
                        'segment_4',
                        'segment_5',
                        'segment_6',
                        'segment_7',
                    ];
                    if (ordinaryRoutes.includes(nextRouteName)) {
                        /*если последний*/
                        let config;
                        segments.forEach(function (segment: { name: string, title: string }, index) {

                            /*Проверяем, если это последний сегмент*/
                            if (segment.name === nextRouteName && index === segmentsLastIndex) {
                                /*проверяем, есть ли b2, если нет, то сегмент последний*/

                                config = configSegments['last_route'];

                            }

                        });
                        if (config) {
                            return config;
                        }

                        return configSegments['route'];

                    }

                    let config = configSegments['route'];


                    segments.forEach(function (segment: { name: string, title: string }, index) {
                        let notSet = true;

                        /*проверяем, есть ли a1, если нет, то сегмент первый*/
                        if (notSet && nextRouteName !== 'a1' && index === 0) {
                            config = configSegments['first_route'];
                            notSet = false;
                        }
                        if (notSet && segment.name === 'segment_1') {
                            config = configSegments['segment_1'];
                            notSet = false;
                        }
                        /*Проверяем, если это последний сегмент*/
                        if (notSet && index === segmentsLastIndex) {
                            /*проверяем, есть ли b2, если нет, то сегмент последний*/
                            if (nextRouteName !== 'b2') {
                                config = configSegments['last_route_wo_b2'];
                            } else {
                                config = configSegments['last_route'];
                            }
                            notSet = false;
                        }

                    });


                    return config;
                }

                getRouteSegments = (): { name: string, title: string }[] => {

                    const segmentsArr: { name: string, title: string }[] = [];
                    for (let i = 1; i < 8; i++) {
                        const segmentValue = this.normalizeRouteValue(Custom.getFieldValue('air_route_' + i));
                        if (segmentValue) {
                            segmentsArr.push({
                                name: `segment_${i}`,
                                title: segmentValue
                            });
                        }
                    }
                    return segmentsArr;

                };
                initActions = () => {

                    this.initFormElements();
                    this.initStatuses();
                    this.colorProgressTable();
                    this.copyRoutesToSegments();

                }

                /**
                 * Добавляем события на элементы, кнопки шага формы
                 */
                addEvents = () => {
                    this.detectFlightDateChanges();
                    this.detectFlightNumberChanges();
                    this.detectRouteDeclarationsChanges();
                    //this.detectEnableEditChanges();
                    this.detectRouteStatusChanges();
                    this.detectCauseSelectorChanges();


                };
                copyRoutesToSegments = async () => {
                    /*Копируем поля из маршрутов авиа в поля Сегмент 1 2 3 и т.д соответственно*/

                    const fieldsUpdate = [];
                    for (let i = 1; i < 8; i++) {
                        const segmentValue = this.normalizeRouteValue(Custom.getFieldValue('air_route_' + i));
                        if (segmentValue) {
                            const fieldUpdate =
                                {
                                    id: _context.mappingByCode[`segment_${i}`].id,
                                    value: segmentValue,
                                };
                            fieldsUpdate.push(fieldUpdate);
                        }
                    }


                    await Custom.updateLeadFields(fieldsUpdate);
                }
                colorProgressTable = () => {
                    const _this = this;
                    const defaultDoneBackground = _context.config.default_done_background;
                    const defaultBackground = _context.config.default_background;
                    const $table = jQuery('.form-step__wrapper table').not('.progress-table-render-preview');
                    const $textTDs = $table.find('.progress-table-status-value-row td');
                    const $textTDsArr = $textTDs.toArray();
                    const $colorTDs = $table.find('.progress-table-status-color-row td');
                    const $colorTDsArr = $colorTDs.toArray();
                    const tdCountMinus1 = $textTDs.length - 1;

                    /*Проходим по массиву td с конца и ищем первый td с текстом. От него и до начала все будут закрашены зеленным по-умолчанию*/
                    let tdWithTextIndex = 0;
                    for (let i = tdCountMinus1; i >= 0; i--) {
                        console.log($textTDsArr[i]['innerText']);
                        if ($textTDsArr[i]['innerText'].trim() !== '' && $textTDsArr[i]['innerText'].trim() !== 'забронировано') {
                            tdWithTextIndex = i;
                            break;
                        } else {
                            jQuery($colorTDsArr[i]).css({"background": defaultBackground, "border-right": `1px solid ${defaultBackground}`});

                        }
                    }

                    /*Красим reserved*/
                    $colorTDs.each(function (index, el) {

                        const $el = $(el);
                        const $textTd = $($textTDsArr[index]);
                        const selectedStatusId = $textTd.attr('data-selected-status-id');
                        const selectedStatusBackground = $textTd.attr('data-selected-status-background');
                        if (selectedStatusId === 'reserved') {
                            $el.css({"background": selectedStatusBackground, "border-right": `1px solid ${selectedStatusBackground}`});

                        }
                    });
                    /*Красим и меняем статус на финальный*/
                    _logger.dev('tdWithTextIndex = ', tdWithTextIndex);
                    $colorTDs.each(function (index, el) {
                        const $textTd = $($textTDsArr[index]);
                        const routeName = $textTd.attr('data-route-name');

                        const finalStatusValue = $textTd.attr('data-final-status-value');
                        const finalStatusId = $textTd.attr('data-final-status-id');
                        const relevantSelect = jQuery(`#row-status-selector-${routeName} select`);
                        if (index < tdWithTextIndex) {
                            const $el = $(el);
                            $el.css({"background": defaultDoneBackground, "border-right": `1px solid ${defaultDoneBackground}`});

                            //Тут пересчитываются статусы сегментов

                            if ($textTd.text().trim() === '') {
                                //ControlBlock.setSelect2Value(relevantSelect, finalStatusId);

                                relevantSelect.val(finalStatusId);
                                // @ts-ignore
                                relevantSelect.select2({
                                    //TODO перенести инициализатор
                                    placeholder: "выбрать",
                                    allowClear: true,
                                    minimumResultsForSearch: Infinity
                                })/*.trigger('change')*/;

                            }

                        }
                    });
                }
                /**
                 * Исправление бага с двойным открытием списка при обнулении.
                 * https://github.com/select2/select2/issues/3320
                 * @param elem
                 */
                removeSelectClearBug = (elem: JQuery<HTMLElement>) => {
                    elem.on("select2:clear", function (evt) {
                        $(this).on("select2:opening.cancelOpen", function (evt) {
                            evt.preventDefault();
                            $(this).off("select2:opening.cancelOpen");
                        });
                    });
                }


                /**
                 * Проверяем, не является ли выбранный вариант дефолтным,
                 * если нет, то подставляем в следующий сегмент его рабочие статусы
                 * @param $elem
                 * @param selectedStatusId
                 * @param selectedRouteName
                 */
                populateStatuses = ($elem: JQuery<HTMLElement>, selectedStatusId: string, selectedRouteName: string) => {
                    const _this = this;

                    let placeholder = "выбрать";
                    let statusType = 'statuses';
                    let resetStatus = false;
                    const $selectElem = $elem.parents('.row-status-selector');
                    const statusesType = $elem.attr('data-statuses-type');
                    const selectedElemOption = $elem.find('option:selected');
                    const selectedOptionValue = selectedElemOption.val();


                    const $selectors = $elem.parents("table").find(".row-status-selector");
                    const elemIndex = $selectors.index($selectElem);


                    const $nextElem = $selectors.eq(elemIndex + 1);

                    const nextRouteName = $nextElem.parents('tbody').attr('data-segment-name');
                    //TODO
                    const segments = _this.getRouteSegments();
                    const routeConfig = _this.getRouteConfig(selectedRouteName, nextRouteName, segments);
                    const currentRouteConfig = _this.getCurrentRouteConfig(selectedRouteName, segments);
                    let routeStatuses = routeConfig.statuses;
                    let currentRouteStatuses = currentRouteConfig.statuses;

                    const $nextSelect = $nextElem.find('select').addClass('populated');
                    let nextSelectedOption = $nextSelect.find('option:selected').val();
                    const $tdText = $(`#${selectedRouteName}-progress-text`);
                    let finalStatusId = $tdText.attr('data-final-status-id');
                    if (selectedRouteName === 'a11') {
                        finalStatusId = 'handed_over';
                    }

                    {

                        let selectedBackground = _context.config.default_background;
                        let selectedText = '';
                        currentRouteStatuses.forEach(function (route) {
                            if (route.id === selectedStatusId) {
                                selectedBackground = route.background;
                                selectedText = route.value;
                            }
                        });

                        const selector = `#${selectedRouteName}-progress-color`;
                        const $selector = $(selector);
                        $selector.css({"background": selectedBackground, "border-right": `1px solid ${selectedBackground}`});
                        $tdText.attr('data-selected-status-background', selectedBackground);
                        $tdText.attr('data-selected-status-text', selectedText);
                        $tdText.text(selectedText);
                    }

                    /*Проверяем, не первый ли это сегмент a1 и первый статус, иначе заполняем следующий*/

                    if ((selectedRouteName === 'a1' && selectedStatusId === 'car_reserved')) {
                        return;
                    }

                    /*Проверяем, если это не первый по индексу элемент и статусы не дефолтные, иначе выходим*/
                    if (elemIndex !== 0 && statusesType === 'default_statuses') {
                        if (nextSelectedOption === '' || nextSelectedOption === undefined) {
                            const defaultBackground = _context.config.default_background;
                            const selector = `#${selectedRouteName}-progress-color`;
                            const $selector = $(selector);

                            $selector.css({"background": defaultBackground, "border-right": `1px solid ${defaultBackground}`});
                            $tdText.attr('data-selected-status-background', defaultBackground);

                        }
                        return;
                    }
                    if (selectedStatusId !== finalStatusId || selectedOptionValue === undefined || selectedOptionValue === '' || selectedStatusId === 'reserved') {
                        routeStatuses = routeConfig.default_statuses;
                        statusType = 'default_statuses';
                        placeholder = "сброшен";
                        //selectedOption = '';
                        //$select.val(value);
                        // @ts-ignore
                        $nextSelect.select2('destroy').html('').trigger('change');
                        resetStatus = true;

                    }

                    console.log({nextRouteName});
                    let selectData = [];

                    routeStatuses.forEach(function (element) {
                        const data = {
                            id: element.id,
                            text: element.value,
                            background: element.background,

                        };
                        selectData.push(data);
                    });

                    if ($selectElem.hasClass('populated')) {
                        return;
                    }


                    //$select.val(value);
                    // @ts-ignore
                    $nextSelect.select2({
                        data: selectData,
                        //TODO перенести инициализатор
                        placeholder,
                        allowClear: true,
                        minimumResultsForSearch: Infinity
                    });

                    if (statusType === 'default_statuses') {

                        $nextSelect.find('option').each(function () {
                            const $elem = $(this);
                            selectData.forEach(function (data) {
                                if (data.id === $elem.val()) {
                                    $nextSelect.find($elem).attr('data-background', data.background);
                                }
                            });
                        });
                    }

                    //$select.trigger('change');
                    //}).trigger('selection:update');
                    $nextSelect.val(nextSelectedOption);

                    if (selectedRouteName === 'a1') {
                        const oldSelectedValue = $nextSelect.val();
                        if (oldSelectedValue === '' && selectedStatusId === 'on_delivery') {
                            $nextSelect.val('waiting');
                        } else {

                        }
                    }
                    if (selectedRouteName === 'a11') {
                        const oldSelectedValue = $nextSelect.val();
                        if (oldSelectedValue !== 'flew_out' && selectedStatusId === 'handed_over') {

                            $nextSelect.val('airport');
                        } else {

                        }
                    }

                    /*Ставим селекту следующему статус статусов "status" :) следующий уровень логики уже будет нейросеть*/
                    $nextSelect.attr('data-statuses-type', statusType);
                    $nextSelect.trigger('change');


                }

                detectRouteStatusChanges = () => {
                    const _this = this;
                    const defaultBackground = _context.config.default_background;
                    $('.row-status-selector select').each(function () {
                        const elem = $(this);

                        _this.removeSelectClearBug(elem);

                        if (!elem.hasClass('processed')) {

                            elem.on("change", function (event) {
                                /*Находим следующий элемент и заполняем его статусами*/
                                /*if (!elem.hasClass('populated')) {
                                    _this.populateStatuses(elem);
                                }*/
                                /*Скрываем открытые причины*/

                                /*const changedValue: string = elem.parents('.segment-group-row-value').attr('data-changed-value');
                                if (changedValue) {
                                    elem.parents('tbody').find('.row-cause-selector').hide();
                                }*/

                                elem.addClass('processed');
                                const selectedOption = elem.find('option:selected');
                                const selectedValue = selectedOption.val();
                                //const routeName = selectedOption.attr('data-route-name');
                                const routeNameAttr = elem.parents('.row-status-selector').attr('id');
                                const routeName = routeNameAttr.split('row-status-selector-')[1];

                                /*Проверяем, не первый ли это сегмент a1 и первый статус, иначе заполняем следующий*/
                                /* if ((routeName === 'a1' && selectedValue === 'car_reserved') || selectedValue === 'reserved') {
                                     console.log({routeName});
                                 } else {
                                     _this.populateStatuses(elem, selectedValue, routeName);
                                 }*/
                                _this.populateStatuses(elem, selectedValue, routeName);


                                const $progressText = $(`#step-form-wrapper-control > #aero-control-progress-table #${routeName}-progress-text`);
                                let background = selectedOption.attr('data-background');
                                const routesStatuses = _context.config.segments.route.statuses;
                                if (selectedValue === 'reserved') {
                                    let background = selectedOption.attr('data-background');

                                    const selectedText = selectedOption.text().trim();
                                    if (selectedText === '') {
                                        background = defaultBackground;
                                    }
                                    $(`#${routeName}-progress-color`).css({background, "border-right": `1px solid ${background}`});

                                    $progressText.text(selectedText);
                                    $progressText.attr('data-selected-status-id', selectedValue);
                                    $progressText.attr('data-selected-status-text', selectedText);
                                    $progressText.attr('data-selected-status-background', background);

                                    /*Если выбрали "забронировано" - включаем кнопку и ничего не делаем*/
                                    _this.generateBtnDecorDefault();
                                    _this.runEnableBtnActions(elem);
                                    //_this.validateSelectStatus(elem);
                                    _this.colorProgressTable();
                                    return;


                                }

                                if (routeName === 'a11') {
                                    //return;
                                    if (selectedValue === 'handed_over') {
                                        let progressText = '', progressBackground = '';
                                        routesStatuses.forEach(function (item, index) {
                                            if (item.id === 'airport') {
                                                progressText = item.value;
                                                progressBackground = item.background;
                                            }
                                        });

                                        const $segment1selectedOption = $('#row-status-selector-segment_1 select');
                                        //ControlBlock.setSelect2Value($segment1selectedOption, 'airport');
                                        $('#segment_1-progress-text').text('в аэропорту');
                                        const background = '#a7e4a8';
                                        $('#segment_1-progress-color').css({background, "border-right": `1px solid ${background}`});

                                        $('#segment_1-progress-text').attr('data-selected-status-id', 'airport');

                                        //_this.populateStatuses(elem, selectedValue, routeName);
                                        _this.colorProgressTable();


                                    }
                                } else {
                                    const selectedText = selectedOption.text().trim();
                                    if (selectedText === '') {
                                        background = defaultBackground;
                                    }

                                    /*Если в сегменте "Размещение груза в аэропорту вылета" остался статус "Ожидание",
                            а в сегментах аэропортов выбран любой статус кроме "Забронировано",
                            статус сегмента "Размещение груза в аэропорту вылета" меняется на "Груз сдан"*/
                                    if (selectedValue !== 'reserved' && routeName !== 'a1'/*&& selectedValue !== 'car_reserved'*/) {
                                        const $segmentA11Select = $('#row-status-selector-a11 select');
                                        const $segmentA11SelectedValue = $segmentA11Select.find('option:selected').val();
                                        if ($segmentA11SelectedValue !== 'handed_over') {
                                            //ControlBlock.setSelect2Value($segmentA11Select, 'handed_over');
                                        }

                                    }


                                    $(`#${routeName}-progress-color`).css({background, "border-right": `1px solid ${background}`});
                                    $progressText.text(selectedText);
                                    $progressText.attr('data-selected-status-id', selectedValue);
                                    $progressText.attr('data-selected-status-text', selectedText);


                                }
                                _this.runEnableBtnActions(elem);
                                //_this.validateSelectStatus(elem);
                                _this.colorProgressTable();


                            });
                        }
                    });
                }

                initStatuses = () => {
                    const _this = this;
                    const defaultBackground = _context.config.default_background;
                    $('.row-status-selector select').each(function () {
                        const elem = $(this);

                        _this.removeSelectClearBug(elem);

                        if (!elem.hasClass('processed')) {


                            elem.addClass('processed');
                            const selectedOption = elem.find('option:selected');
                            const selectedValue = selectedOption.val();
                            //const routeName = selectedOption.attr('data-route-name');
                            const routeNameAttr = elem.parents('.row-status-selector').attr('id');
                            const routeName = routeNameAttr.split('row-status-selector-')[1];

                            /*Проверяем, не первый ли это сегмент a1 и первый статус, иначе заполняем следующий*/
                            /*if ((routeName === 'a1' && selectedValue === 'car_reserved') || selectedValue === 'reserved') {
                                console.log({routeName});
                            } else {
                                _this.populateStatuses(elem, selectedValue, routeName);
                            }*/
                            _this.populateStatuses(elem, selectedValue, routeName);


                            const $progressText = $(`#step-form-wrapper-control > #aero-control-progress-table #${routeName}-progress-text`);
                            let background = selectedOption.attr('data-background');
                            const routesStatuses = _context.config.segments.route.statuses;
                            if (selectedValue === 'reserved') {
                                let background = selectedOption.attr('data-background');

                                const selectedText = selectedOption.text().trim();
                                if (selectedText === '') {
                                    background = defaultBackground;
                                }
                                $(`#${routeName}-progress-color`).css({background, "border-right": `1px solid ${background}`});

                                $progressText.text(selectedText);
                                $progressText.attr('data-selected-status-id', selectedValue);
                                $progressText.attr('data-selected-status-text', selectedText);
                                $progressText.attr('data-selected-status-background', background);

                                /*Если выбрали "забронировано" - включаем кнопку и ничего не делаем*/
                                _this.generateBtnDecorDefault();
                                _this.runEnableBtnActions(elem);
                                //_this.validateSelectStatus(elem);
                                _this.colorProgressTable();
                                return;


                            }

                            if (routeName === 'a11') {
                                return;

                                if (selectedValue === 'handed_over') {
                                    let progressText = '', progressBackground = '';
                                    routesStatuses.forEach(function (item, index) {
                                        if (item.id === 'airport') {
                                            progressText = item.value;
                                            progressBackground = item.background;
                                        }
                                    });
                                    const $segment1selectedOption = $('#row-status-selector-segment_1 select');
                                    //ControlBlock.setSelect2Value($segment1selectedOption, 'airport');
                                    $('#segment_1-progress-text').text('в аэропорту');
                                    const background = '#a7e4a8';
                                    $('#segment_1-progress-color').css({background, "border-right": `1px solid ${background}`});

                                    $('#segment_1-progress-text').attr('data-selected-status-id', 'airport');

                                    //_this.populateStatuses(elem, selectedValue, routeName);
                                    _this.colorProgressTable();


                                }
                            } else {
                                const selectedText = selectedOption.text().trim();
                                if (selectedText === '') {
                                    background = defaultBackground;
                                }

                                $(`#${routeName}-progress-color`).css({background, "border-right": `1px solid ${background}`});
                                $progressText.text(selectedText);
                                $progressText.attr('data-selected-status-id', selectedValue);
                                $progressText.attr('data-selected-status-text', selectedText);

                            }
                            _this.runEnableBtnActions(elem);
                            _this.colorProgressTable();

                        }
                    });
                }

                private static setSelect2Value($select: JQuery<HTMLElement>, value: string) {

                    $select.val(value);
                    // @ts-ignore
                    $select.select2({
                        //TODO перенести инициализатор
                        placeholder: "выбрать",
                        allowClear: true,
                        minimumResultsForSearch: Infinity
                    }).trigger('selection:update');
                }

                detectCauseSelectorChanges = () => {
                    const _this = this;
                    $('.cause-selector-wrapper select').each(function () {
                        const elem = $(this);
                        const $row = elem.parents('.segment-group-row');
                        _this.removeSelectClearBug(elem);
                        elem.on("change", function (event) {

                            const selectedOption = elem.find('option:selected');
                            const selectedOptionValue = selectedOption.val();
                            const routeName = selectedOption.attr('data-route-name');
                            const customCauseInput = $row.find('.row-cause-selector .custom-cause-input');
                            if (selectedOptionValue === 'custom') {
                                customCauseInput.show();
                            } else {
                                customCauseInput.hide();
                            }
                            //"Включаем кнопку"
                            _this.runEnableBtnActions();
                        });

                    });
                }

                detectFlightDateChanges = () => {
                    const _this = this;
                    $('.flight-date input').each(function () {
                        const elem = $(this);
                        if (!elem.hasClass('flight-date-change-bind')) {
                            elem.bind("change", function (event) {
                                //_this.validateSelectStatus(elem.parents('tbody').find('.row-status-selector select'));

                                elem.addClass('flight-date-change-bind');

                                _this.inputChangesHandler(elem);
                                _this.updateProgressTableRows(elem);
                                elem.parents('.segment-group-row-value').attr('data-changed-value', true);


                            });
                        }

                        _this.updateProgressTableRows(elem);
                    });


                }
                /**
                 * Обновляем ячейку строки в таблице прогресса при смене даты или номера рейса
                 * @param elem
                 */
                updateProgressTableRows = (elem: JQuery<HTMLElement>) => {
                    const elemValue = elem.val();
                    let elemType = 'date';
                    /*Определяем, что за поле - дата или номер рейса*/
                    if (elem.hasClass('flight-number')) {
                        elemType = 'flight';
                    }

                    const parent = elem.parents('tbody');
                    const segmentName: string = parent.attr('data-segment-name');
                    if (![/*'a1',*/ 'a11', 'b2'].includes(segmentName)) {
                        const progressTd = $(`.progress-table-${elemType}-row td[data-route-name="${segmentName}"]`);
                        progressTd.text(elemValue);
                    }


                }
                detectFlightNumberChanges = () => {
                    const _this = this;
                    $('input.flight-number').each(function () {
                        const elem = $(this);

                        elem.on("input keyup paste", function (event) {
                            _this.inputChangesHandler(elem);
                            _this.updateProgressTableRows(elem);
                            elem.parents('.segment-group-row-value').attr('data-changed-value', true);
                        });
                        _this.updateProgressTableRows(elem);
                    });

                }
                detectRouteDeclarationsChanges = () => {
                    const _this = this;
                    $('input.route-declaration').each(function () {

                        const elem = $(this);
                        //  keyup paste
                        elem.on("input keyup paste", function (event) {
                            _this.inputChangesHandler(elem);
                        });
                    });

                }
                inputChangesHandler = (elem: JQuery<HTMLElement>) => {
                    const initValue: string = elem.parents('.segment-group-row-value').attr('data-init-value');
                    /*Проверяем, есть ли начальное значение, если есть - значит изменение и вот это все*/
                    /*Также проверяем, есть уже правки после инициализации виджета(его открытии)*/
                    const changedValue: string = elem.parents('.segment-group-row-value').attr('data-changed-value');

                    if (initValue || changedValue) {

                        const $group = elem.parents('.segment-group');
                        /*Проверяем, не открыта ли причина уже для рейса?*/
                        const isNumberCauseNotVisible = $group.find('.segment-flight-number .cause-selector-wrapper').css('display') === 'none';
                        const $selectorWrapper = elem.parents('.segment-group-row').find('.row-cause-selector .cause-selector-wrapper');
                        const elemVal = elem.val();

                        if (initValue != elem.val()) {

                            const isCurrentIsLastOne = this.isCurrentGroupIsLast(elem);
                            if ($selectorWrapper && (changedValue || isNumberCauseNotVisible) && isCurrentIsLastOne) {

                                $selectorWrapper.show().addClass(`${this.widgetName}-cause-selected`);
                                if (changedValue) {
                                    $selectorWrapper.parents('.row-cause-selector');
                                }
                            }

                            this.runEnableBtnActions(elem);

                        } else {
                            if ($selectorWrapper) {
                                $selectorWrapper.hide().removeClass(`${this.widgetName}-cause-selected`);
                            }

                            this.runDisableBtnActions(elem);
                        }
                    } else {
                        if (elem.val() !== 'reserved') {
                            const changedClass = `${this.widgetName}-input-value-changed`;
                            $(`.${changedClass}`).removeClass(`${changedClass}`);
                            elem.addClass(`.${changedClass}`);
                        }

                        this.runEnableBtnActions(elem);
                        if (elem.val() === '') {
                            this.runDisableBtnActions(elem);
                        }

                    }
                }
                runDisableBtnActions = (elem: JQuery) => {
                    const id = elem.attr('id');
                    /*Удаляем из массива ивентов id, и если ничего не осталось, т.е. все "disabled" то отключаем кнопку*/

                    const index = this.enableEventsCounter.indexOf(id);
                    if (index > -1) {
                        this.enableEventsCounter.splice(index, 1);
                    }
                    _logger.dev('counter--', this.enableEventsCounter);
                    if (this.enableEventsCounter.length === 0) {
                        this.$generateBtn.trigger('button:save:disable').prop('disabled', true);
                    }

                    /*Меняем required к селекту статуса*/
                    this.removeValidateErrorSelectStatus(elem);
                    //this.validateSelectStatus(elem);
                    //this.setSelectStatusRequired(elem, 0);


                    /*Удаляем элементу класс "измененный"*/
                    elem.removeClass(`${this.widgetName}-input-value-changed`);

                }
                addEventCounter = (elem: JQuery) => {
                    if (elem) {
                        const id = elem.attr('id');
                        /*Добавляем в счетчик "включений" кнопки этот ивент*/
                        if (!this.enableEventsCounter.includes(id)) {
                            this.enableEventsCounter.push(id);
                        }
                        /*Добавляем к элементу класс "измененный"*/
                        elem.addClass(`${this.widgetName}-input-value-changed`);
                    }
                }
                getStatusSelectedValue = (elem: JQuery) => {
                    const $group = elem.parents('.segment-group');
                    const $row = $group.find('.segment-group-row.segment-status');
                    const $select = $row.find('.row-status-selector select');
                    const selectedOption = $select.find('option:selected');
                    const selectedValue = selectedOption.val();

                    return selectedValue;
                }
                getStatusSelectRow = (elem: JQuery): JQuery => {
                    const $group = elem.parents('.segment-group');
                    const $row = $group.find('.segment-group-row.segment-status');

                    return $row;
                }
                validateSelectStatus = (elem: JQuery) => {

                    const $row = this.getStatusSelectRow(elem);
                    const selectedValue = this.getStatusSelectedValue(elem);
                    let elemVal = elem.val();
                    /*Проверяем, не заполнена ли дата или рейс*/
                    const flightNumberVal = elem.parents('tbody').find('input.flight-number').val();
                    const flightDateVal = elem.parents('tbody').find('input.date_field').val();

                    /*Проверяем, кто источник - поле или селект, если поле, то значение селекта не проверяем*/

                    if (elemVal === flightNumberVal || elemVal === flightDateVal) {
                        elemVal = '';
                    }
                    const changedInput = !!flightDateVal || !!flightNumberVal;

                    if (changedInput && (!selectedValue && !elemVal)) {
                        $row.addClass('nika-select2-preflight-required');
                        //$row.addClass('nika-select2-required');
                    } else {
                        $row.removeClass('nika-select2-preflight-required');
                        $row.removeClass('nika-select2-required');
                    }

                }
                removeValidateErrorSelectStatus = (elem: JQuery) => {
                    const $row = this.getStatusSelectRow(elem);
                    //const selectedValue = this.getStatusSelectedValue(elem);
                    $row.removeClass('nika-select2-required');
                    $row.removeClass('nika-select2-preflight-required');

                }
                markTriggeredElem = (elem: JQuery) => {
                    const triggeredClass = `${this.widgetName}-triggered-element`;
                    jQuery(`.${triggeredClass}`).removeClass(triggeredClass);
                    elem.addClass(triggeredClass);

                }

                runEnableBtnActions = (elem?: JQuery) => {
                    if (elem) {
                        this.addEventCounter(elem);
                        /*Меняем required к селекту статуса*/
                        this.validateSelectStatus(elem);
                        this.markTriggeredElem(elem);
                    }
                    this.generateBtnDecorDefault();

                    //_logger.dev('counter++', this.enableEventsCounter);
                }
                initFormElements = () => {
                    // @ts-ignore
                    jQuery('.status-selector').select2({
                        placeholder: "выбрать",
                        allowClear: true,
                        minimumResultsForSearch: Infinity
                    });

                    function template(data) {
                        if ($(data.element).attr('data-html')) {
                            return $(data.element).attr('data-html');
                        }
                        return data.text;
                    }

                    // @ts-ignore
                    jQuery('.cause-selector').select2({
                        placeholder: "выбрать",
                        templateResult: template,
                        templateSelection: template,
                        allowClear: true,
                        //minimumResultsForSearch: Infinity,
                        escapeMarkup: function (markup) {
                            return markup;
                        }
                    });
                    /*делаем кнопку генерации кода шаблона неактивной*/
                    this.$generateBtn = $(`#${this.widgetName}_generate-button`);
                    this.$generateBtn.trigger('button:save:disable').prop('disabled', true);

                };
                /**
                 * Определяем последний заполненный инпут с заполненным статусом - по нему и нужно строить код шаблона
                 */
                getLastFilledInputWithStatus = (): JQuery => {
                    const _this = this;
                    /*Фильтруем сегменты с вылетом*/
                    const $aeroSegments = $('.segment-group').not('#segment-group-MAWB').filter(function () {

                        /*Проверяем, сегмент ли это?*/
                        const dataSegmentName = $(this).attr('data-segment-name');
                        const isAeroSegment = dataSegmentName.startsWith('segment_');

                        debugger;
                        return isAeroSegment;
                    });
                    const filledInputs = $aeroSegments.find('.segment-group-row-value input').filter(function () {
                        const isInputFilled = this.value !== "";

                        const selectedValue = _this.getStatusSelectedValue($(this));
                        const isSelectFilled = selectedValue && selectedValue !== 'reserved';

                        return isInputFilled && isSelectFilled;
                    });
                    return filledInputs.last();
                }
                isCurrentGroupIsLast = (elem: JQuery): boolean => {
                    let result = false;
                    const $lastFilledInput = this.getLastFilledInputWithStatus();
                    if (elem && $lastFilledInput.length > 0) {
                        const $lastFilledGroup = $lastFilledInput.parents('.segment-group');
                        const $currentGroup = elem.parents('.segment-group');
                        result = $lastFilledGroup[0] === $currentGroup[0];
                    }

                    return result;
                }
                /**
                 * Определяем, что и где поменялось и какие значения - рейс, дата и причина
                 */
                getLastChangedHTMLEntities = (): { dateCauseValue: string, numberCauseValue: string, lastChangedFlightNumber: JQuery, lastChangedFlightDate: JQuery, segmentName: string } => {

                    const addedClass = `${this.widgetName}-input-value-changed`;
                    let lastChangedFlightNumber, lastChangedFlightDate;
                    const $lastChangedInput = $(`input.${addedClass}`).last();
                    let dateCauseValue: string, numberCauseValue: string;
                    /*Определяем, есть ли инпуты заполненные после текущего?*/
                    const isCurrentIsLastOne = this.isCurrentGroupIsLast($lastChangedInput);
                    const $lastFilledInput = this.getLastFilledInputWithStatus();
                    const segmentParent = $lastChangedInput.parents('.segment-group');


                    if (isCurrentIsLastOne) {
                        /*Определяем, что за тип инпута - дата или рейс*/
                        if ($lastChangedInput.hasClass('flight-number')) {
                            lastChangedFlightNumber = $lastChangedInput;
                            /*Определяем, есть ли "рядом" дата измененная*/
                            const neighbourDateInput = segmentParent.find('.date_field');
                            if (neighbourDateInput.hasClass(addedClass)) {
                                lastChangedFlightDate = neighbourDateInput;
                                dateCauseValue = this.getCauseValueForInput(lastChangedFlightDate);
                            }
                            numberCauseValue = this.getCauseValueForInput($lastChangedInput);
                            /*Определяем, есть ли "рядом" причина измененная*/
                        }
                        if ($lastChangedInput.hasClass('date_field')) {
                            lastChangedFlightDate = $lastChangedInput;
                            /*Определяем, есть ли "рядом" номер рейса измененный*/
                            const neighbourNumberInput = segmentParent.find('.flight-number');
                            if (neighbourNumberInput.hasClass(addedClass)) {
                                lastChangedFlightNumber = neighbourNumberInput;
                                numberCauseValue = this.getCauseValueForInput(lastChangedFlightNumber);
                            }
                            /*Определяем, есть ли "рядом" причина измененная*/
                            dateCauseValue = this.getCauseValueForInput($lastChangedInput);

                        }
                    } else {
                        /*После инпута есть заполненные инпуту и их надо вывести, а не текущий в код шаблона*/
                        const $segmentParent = $lastFilledInput.parents('.segment-group');
                        lastChangedFlightDate = $segmentParent.find('.date_field');
                        lastChangedFlightNumber = $segmentParent.find('.flight-number');


                    }
                    const segmentName = segmentParent.find('.segment-group-header-value').text();

                    return {dateCauseValue, numberCauseValue, lastChangedFlightNumber, lastChangedFlightDate, segmentName}


                }
                updateFieldsByGenerateBtn = async (code: {}) => {
                    const fieldsValues = Custom.getFormFieldsValues();
                    const fieldsUpdate =
                        {
                            id: _context.mappingByCode['control_template_code'].id,
                            value: code['control_template_code'],
                        };

                    fieldsValues.push(fieldsUpdate);
                    fieldsValues.push(
                        {
                            id: _context.mappingByCode['control_template_code_2'].id,
                            value: code['control_template_code_2'],
                        });

                    await Custom.updateLeadFields(fieldsValues);


                }
                generateBtnDecorDefault = () => {
                    const btn = this.$generateBtn;
                    btn.removeClass('btn-validation-error');
                    btn.trigger('button:save:enable').prop('disabled', false)
                    btn.text(_context.config.btn_text.init);
                }
                generateBtnDecorStart = (btn: JQuery) => {
                    btn.removeClass('btn-validation-error');
                    const oldTitle = btn.text();
                    btn.attr('data-old-title', oldTitle);
                    btn.text(_context.config.btn_text.progress);
                    btn.trigger('button:load:start');
                    btn.find('.button-input__spinner').css(
                        {
                            'display': 'inline-block',
                            'left': '10px',
                            'padding-left': '10px'
                        });
                    btn.prop('disabled', true);
                }
                generateBtnDecorError = (btn: JQuery, msg: string) => {
                    const oldTitle = btn.text();
                    btn.attr('data-old-title', oldTitle);
                    btn.text(msg);
                    btn.addClass('btn-validation-error');
                    btn.prop('disabled', true);

                }
                generateBtnDecorStop = (btn: JQuery) => {
                    /*для создания эффекта работы алгоритма*/
                    const syntheticDelay = 400;

                    setTimeout(() => {
                        btn.text(_context.config.btn_text.success);
                        btn.addClass('nika-btn-success');
                        btn.trigger('button:load:stop');

                        setTimeout(() => {
                            const oldTitle = btn.attr('data-old-title');
                            btn.text(oldTitle);
                            btn.removeClass('nika-btn-success');
                            btn.removeClass('button-input_blue');
                        }, syntheticDelay * 2);
                    }, syntheticDelay);

                }
                renderPreview = (code: string) => {
                    //TODO
                    jQuery(`#${this.widgetName}-code-preview`).remove();
                    jQuery(`#nika-${this.widgetName}-base-form`).append(`<div id="${this.widgetName}-code-preview"><div><strong>Предпросмотр кода шаблона</strong></div>${code}</div>`);
                }
                /**
                 * После генерации надо сбросить выбранные поля, чтобы срабатывали другие
                 */
                resetFormState = () => {
                    //Удаляем все классы по которым с формы собираются данные
                    const changeFlagClass = `${this.widgetName}-input-value-changed`;
                    const triggeredClass = `${this.widgetName}-triggered-element`;

                    jQuery(`.${changeFlagClass}`).removeClass(changeFlagClass);
                    jQuery(`.${triggeredClass}`).removeClass(triggeredClass);
                    //jQuery(`.${triggeredClass}`).not(`.${triggeredClass}`).removeClass(triggeredClass);
                    const l = jQuery(changeFlagClass).length;
                    //jQuery('.row-cause-selector').hide();

                    $('.row-cause-selector .cause-selector-wrapper').hide();


                }
                validateInputs = () => {
                    /*Проверяем, есть ли пустые селекты, которые должны быть заполнены*/
                    const $preflights = jQuery('.nika-select2-preflight-required');
                    if ($preflights.length > 0) {
                        $preflights.addClass('nika-select2-required');
                        return false;
                    }

                    return true;

                }
                generateCodeActions = async (btn: JQuery) => {

                    if (!this.validateInputs()) {
                        this.generateBtnDecorError(btn, _context.config.btn_text.error.validation);
                        _logger.dev('Ошибка валидации');
                        return;
                    }

                    this.generateBtnDecorStart(btn);

                    const {dateCauseValue, numberCauseValue, lastChangedFlightNumber, lastChangedFlightDate, segmentName}
                        = this.getLastChangedHTMLEntities();


                    let controlTemplateCode = this.generateHtmlCode(dateCauseValue, numberCauseValue, lastChangedFlightNumber, lastChangedFlightDate, segmentName);
                    let controlTemplateCode2 = this.generateHtmlCodeA11();


                    await this.updateFieldsByGenerateBtn({'control_template_code': controlTemplateCode, 'control_template_code_2': controlTemplateCode2});

                    this.renderPreview(controlTemplateCode);
                    this.resetFormState();

                    this.generateBtnDecorStop(btn);


                }

                /**
                 * Генерация кода для шаблона
                 * @param dateCauseValue
                 * @param numberCauseValue
                 * @param lastChangedFlightNumber
                 * @param lastChangedFlightDate
                 * @param segmentName
                 * @constructor
                 * @private
                 */
                private generateHtmlCode(dateCauseValue: string, numberCauseValue: string, lastChangedFlightNumber: JQuery<HTMLElement>, lastChangedFlightDate: JQuery<HTMLElement>, segmentName: string): string {

                    let code = this.generateProgressRoutesCode(segmentName);

                    code += this.generateCausedByCode(dateCauseValue, numberCauseValue, segmentName);
                    code += this.generateFlightDateNumberCode(lastChangedFlightNumber, lastChangedFlightDate);
                    return code;
                }

                private generateHtmlCodeA11() {
                    /*AWB
                    Размещение груза в аэропорту вылета*/
                    let spanCargoInAirport = '';

                    const segmentA11selectedOption = $('#row-status-selector-segment_1 select option:selected').val();
                    const a11Date = $('.segment-group-a11 input.date_field').val();
                    const allSelectedStatuses = $('.row-status-selector').not('#row-status-selector-a1').find('select' +
                        ' option:selected');

                    if (a11Date) {
                        /*Это поле убирается если в сегменте "Размещение груза в аэропорту вылета" выбран статус "Груз сдан".
                         Или выбран любой статус в сегментах аэропортов кроме статуса "Забронировано"*/

                        if (segmentA11selectedOption !== 'handed_over') {
                            let allReserved = true;
                            allSelectedStatuses.each(function () {
                                const value = $(this).val();
                                const isReservedOrEmpty = value === 'reserved' || value === 'waiting' || value === '';
                                allReserved = allReserved && isReservedOrEmpty;
                            });

                            if (allReserved) {
                                spanCargoInAirport = `<span style="font-size: 15px; font-weight: bold; font-family: Tahoma; color: #666666;">Размещение груза в аэропорту вылета: <span style="color: #000;"> ${a11Date}</span></span><br>`;
                            }
                        }
                    }
                    let html = `<table align="center"cellspacing="0"><tbody><tr ><td style="height: 25px; width: 29.33333396911621px;" rowspan="1" height="30">&nbsp;</td><td style="height: 25px; width: 384px; text-align: left" colspan="3" rowspan="1">${spanCargoInAirport} </td> <td style="height: 25px;" rowspan="1" height="30">&nbsp;</td><td style="height: 25px; width: 335.0625px; text-align: left" colspan="3" rowspan="1">&nbsp;</td> </tr> </tbody></table>`;
                    const $html = jQuery(html);

                    $html.wrapAll('<div>').parent().find('table').css({
                        "border": "none",
                        "width": "800px",
                        "margin-top": "20px"
                    });
                    html = $html[0].outerHTML;
                    if (spanCargoInAirport) {
                        return html;
                    }

                    return '';


                }

                /**
                 * Получаем таблицу прогресса сегментов
                 */
                generateProgressRoutesCode = (segmentName: string): string => {

                    let html: string = jQuery(`#${this.widgetName}-progress-table`)[0].outerHTML;


                    html = html.replace(/[\n\r]/g, "");
                    /*Превращаем в JQuery*/
                    const $html = jQuery(html);
                    const tableId = $html.attr('id');
                    /*Меняем id таблицы на preview*/
                    // $html.attr('id', `${tableId}-preview`);
                    $html.addClass('progress-table-render-preview');

                    /* меняем стили */


                    $html.wrapAll('<div>').parent().find('table').css({
                        "border": "1px solid #cfcece",
                        "width": "800px",
                        "margin-top": "20px"
                    });
                    $html.find('.route-title-value').css({
                        'font-weight': 'bold',
                        'font-size': '14px'
                    });
                    $html.find('td').css({
                        "border": "1px solid #cfcece",
                    });

                    const segmentsRow = $html.find('.progress-table-route-title-row');
                    const changedSegmentTr = segmentsRow.find(`td:contains("${segmentName}")`);
                    const changedSegmentIndex = changedSegmentTr.index();

                    const trStyles = {
                        'background': '#c7dce7',
                        'font-weight': 'bold'

                    };

                    if (segmentName !== '') {
                        $('.progress-table-flight-row td', $html).eq(changedSegmentIndex).css(trStyles);
                        $('.progress-table-date-row td', $html).eq(changedSegmentIndex).css(trStyles);
                    }


                    html = $html[0].outerHTML;

                    return html;
                }
                getCauseValueForInput = (lastChangedInput: JQuery) => {
                    let causeValue, causeId;
                    const causeSelectedClass = `${this.widgetName}-cause-selected`;
                    const parentRow = lastChangedInput.parents('.segment-group-row-value');
                    const neighbourCauseSelector = parentRow.find('.row-cause-selector .cause-selector-wrapper');
                    if (neighbourCauseSelector.hasClass(causeSelectedClass)) {
                        const selectedOption = neighbourCauseSelector.find('select option:selected');
                        causeValue = selectedOption.text().trim();
                        causeId = selectedOption.val();
                        const htmlCause = selectedOption.attr('data-html');
                        if (htmlCause) {
                            causeValue = htmlCause;
                        }
                        if (causeId === 'custom') {
                            /*Это кастомная причина - ее ищем в отдельном инпуте*/
                            const customCause = parentRow.find('.custom-cause');
                            causeValue = customCause.val();
                            causeValue = causeValue as string;
                            causeValue = causeValue.trim();
                        }
                    }
                    return causeValue;
                }
                generateCausedByCode = (dateCauseValue: string, numberCauseValue: string, segmentName: string): string => {

                    /*Если выбрана причина смены даты - то получаем ее
                     * если номера рейса - то ее
                     * если дата и рейс, то берем только причину номера рейса
                     *
                     * Дата вылета изменилась по причине / № рейса изменился по причине		причина

                        № рейса	Подставляются в зависимости от заполнения сегмента
                        Дата вылета	подставляются в зависимости от заполнения сегмента
                    * */
                    let html = '';
                    let causeByText = '';
                    let causeByValue = '';

                    if (dateCauseValue) {
                        causeByText = `Дата вылета из ${segmentName} изменилась по причине`;
                        causeByValue = dateCauseValue;
                    }
                    if (numberCauseValue) {
                        causeByText = `№ рейса из ${segmentName} изменился по причине`;
                        causeByValue = numberCauseValue;
                    }


                    if (causeByValue && causeByText) {

                        html = `<table align="center" cellspacing="0"><tbody><tr style="background: #fbe5d6">
                                <td style="height: 25px; width: 29.33333396911621px;" rowspan="1">&nbsp;</td>
                                <td style="height: 25px; width: 384.5416564941406px; text-align: left; font-weight: bold; font-size: 15px;" colspan="3" rowspan="1">
                                    ${causeByText}    
                                </td>
                                <td style="height: 25px; width: 0.8958333134651184px;" rowspan="1">&nbsp;</td>
                                <td style="height: 25px; width: 335.0625px; text-align: left;   font-size: 15px;" colspan="3" rowspan="1">${causeByValue}</td>
                            </tr></tbody></table>`;
                        const $html = jQuery(html);

                        $html.wrapAll('<div>').parent().find('table').css({
                            "border": "none",
                            "width": "800px",
                            "margin-top": "20px"
                        });
                        html = $html[0].outerHTML;
                    }

                    return html;
                }

                generateFlightDateNumberCode = (flightNumberElem: JQuery, flightDateElem: JQuery): string => {
                    /*№ рейса	Подставляются в зависимости от заполнения сегмента
                      Дата вылета, то подставляются в зависимости от заполнения сегмента*/
                    let spanFlightNumber = '';
                    let spanFlightDate = '';
                    let spanMAWB = '';

                    let flightNumber = typeof flightNumberElem !== "undefined" ? flightNumberElem.val() : '';
                    let flightDate = typeof flightDateElem !== "undefined" ? flightDateElem.val() : '';
                    //const MAWB = Custom.getFieldValue('MAWB');
                    const MAWB = $('#segment-group-MAWB .segment-group-row-value input').val();

                    /*Возможны такие ситуации:
                     * 1. если нет измененных номера и даты, но есть смена статуса или awb
                     * тогда ищем "последний" сегмент со статусом и берем от туда номер и дату рейса
                     * 2. если нет или номера или даты, то нужно взять из одного row существующее значение
                     * */
                    { /*Первый кейс*/
                        if (!flightNumber && !flightDate) {
                            /*Получаем "последний" сегмент со статусом*/
                            const $lastSelectedStatusElem: JQuery = $('.row-status-selector select option:selected').filter(function () {
                                return this.value;
                            }).last();
                            const $parentGroup = $lastSelectedStatusElem.parents('.segment-group');
                            const $lastFlightDateElem = $parentGroup.find('.segment-flight-date input.date_field');
                            const $lastFlightNumberElem = $parentGroup.find('.segment-flight-number input.flight-number');
                            const lastFlightDateVal = $lastFlightDateElem.val();
                            const lastFlightNumberVal = $lastFlightNumberElem.val();
                            if (lastFlightDateVal) {
                                flightDate = lastFlightDateVal;
                            }
                            if (lastFlightNumberVal) {
                                flightNumber = lastFlightNumberVal;
                            }

                        }
                    }

                    { /*Второй кейс*/
                        if (flightNumberElem && !flightDateElem) {
                            /*Ищем дату*/
                            const $parentGroup = flightNumberElem.parents('.segment-group');
                            const $flightDateElem = $parentGroup.find('.segment-flight-date input.date_field');
                            const flightDateVal = $flightDateElem.val();
                            if (flightDateVal) {
                                flightDate = flightDateVal;
                            }

                        }
                        if (flightDateElem && !flightNumberElem) {
                            /*Ищем номеру*/
                            const $parentGroup = flightDateElem.parents('.segment-group');
                            const $flightNumberElem = $parentGroup.find('.segment-flight-number input.flight-number');
                            const flightNumberVal = $flightNumberElem.val();
                            if (flightNumberVal) {
                                flightNumber = flightNumberVal;
                            }
                        }
                    }


                    if (flightNumber) {
                        spanFlightNumber = `<span style="font-size: 15px; font-weight: bold; font-family: Tahoma; color: #666666;">№ рейса: <span style="color: #000;"> ${flightNumber}</span></span><br>`;
                    }
                    if (flightDate) {
                        spanFlightDate = `<span style="font-size: 15px; font-weight: bold; font-family: Tahoma; color: #666666;">Дата вылета: <span style="color: #000;"> ${flightDate}</span></span><br>`;
                    }
                    if (MAWB) {
                        spanMAWB = `<span style="font-size: 15px; font-weight: bold; font-family: Tahoma; color: #666666;">AWB: <span style="color: #000;"> ${MAWB}</span></span><br>`;
                    }

                    let html = `<table align="center"cellspacing="0"><tbody><tr ><td style="height: 25px; width: 29.33333396911621px;" rowspan="1" height="30">&nbsp;</td><td style="height: 25px; width: 384px; text-align: left" colspan="3" rowspan="1">${spanFlightNumber} ${spanFlightDate} ${spanMAWB}</td> <td style="height: 25px;" rowspan="1" height="30">&nbsp;</td><td style="height: 25px; width: 335.0625px; text-align: left" colspan="3" rowspan="1">&nbsp;</td> </tr> </tbody></table>`;
                    const $html = jQuery(html);

                    $html.wrapAll('<div>').parent().find('table').css({
                        "border": "none",
                        "width": "800px",
                        "margin-top": "20px"
                    });
                    html = $html[0].outerHTML;

                    return html;
                }

            }

            return new ControlBlock();

        };
    });