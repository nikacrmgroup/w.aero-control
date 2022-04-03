'use strict';
define([
    'underscore', 'jquery', './libs/amoSettings.js', './libs/amoPrivateApi.js', './custom.js', './utils.js'
], function (_, $, AmoSettings, AmoPrivateApi, Custom, Utils) {
    return function (_widget, _logger, _context, _templater) {
        class ControlBlock {
            settings;
            mappingById;
            mappingByCode;
            amoCfValues;
            preparedAmoCfValues;
            preparedParams;
            fieldNames;
            enableEventsCounter;
            $generateBtn;
            widgetName;
            constructor() {
            }
            normalizeRouteValue(route) {
                if (route === undefined || route === '[]') {
                    route = '';
                }
                return route;
            }
            ;
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
                const routeA1 = this.normalizeRouteValue(Custom.getFieldValue('auto_route_a1'));
                const routeB2 = this.normalizeRouteValue(Custom.getFieldValue('auto_route_b2'));
                const segments = this.getRouteSegments();
                const routesHeader = this.createRoutesHeader(routeA1, segments, routeB2);
                const routesRows = this.createRoutesRows(routeA1, segments, routeB2);
                const preparedRows = this.populateRoutesRows(routesRows);
                return {
                    routesHeader,
                    causes: _context.config.causes,
                    rows: preparedRows,
                    amoFields: this.preparedParams,
                    default_background: _context.config.default_background,
                };
            };
            populateRoutesRows = (routesRows) => {
                const _this = this;
                let populatedRows = [];
                const savedValuesJson = Custom.getFieldValue('control_block_code');
                if (Utils.isJsonString(savedValuesJson)) {
                    const savedValues = JSON.parse(savedValuesJson);
                    const savedValuesObj = Utils.convertArrayToObject(savedValues, 'id');
                    routesRows.forEach(function (routeToPopulate) {
                        const name = routeToPopulate.name;
                        const populatedRow = routeToPopulate;
                        const finalStatusObj = populatedRow.statuses[populatedRow.statuses.length - 1];
                        populatedRow['final_status_value'] = finalStatusObj.value;
                        populatedRow['final_status_id'] = finalStatusObj.id;
                        const indexName = `${name}-status`;
                        if (indexName in savedValuesObj) {
                            populatedRow['selected_status'] = savedValuesObj[indexName].value;
                            const rowStatusesObj = Utils.convertArrayToObject(populatedRow.statuses, 'id');
                            const status = rowStatusesObj[savedValuesObj[indexName].value];
                            if (status !== undefined && ('value' in status)) {
                                populatedRow['selected_status_text'] = rowStatusesObj[savedValuesObj[indexName].value].value;
                                populatedRow['selected_status_id'] = rowStatusesObj[savedValuesObj[indexName].value].id;
                                populatedRow['selected_status_background'] = rowStatusesObj[savedValuesObj[indexName].value].background;
                            }
                        }
                        if (!['b2'].includes(routeToPopulate.name)) {
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
            };
            populateA1B2helper = function (routeName, paramName, savedValuesObj, populatedRow) {
                const indexName = `${routeName}-${paramName}`;
                if (indexName in savedValuesObj) {
                    paramName = paramName.replace(/-/g, "_");
                    populatedRow[paramName] = savedValuesObj[indexName].value;
                }
            };
            createRoutesHeader = (routeA1, segments, routeB2) => {
                const routesArr = [];
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
            createRoutesRows(routeA1, segments, routeB2) {
                const configSegments = _context.config.segments;
                const templateRows = [];
                if (routeA1) {
                    const config = configSegments['a1'];
                    let row = {
                        name: 'a1',
                        title: routeA1,
                        description: config.description,
                        statuses: config.statuses,
                        default_statuses: config.default_statuses
                    };
                    templateRows.push(row);
                }
                {
                    const config = configSegments['a11'];
                    let defaultStatuses = config.default_statuses;
                    if (!routeA1) {
                        defaultStatuses = config.statuses;
                    }
                    let row = {
                        name: 'a11',
                        title: '',
                        description: config.description,
                        statuses: config.statuses,
                        default_statuses: defaultStatuses
                    };
                    templateRows.push(row);
                }
                const segmentsLastIndex = segments.length - 1;
                segments.forEach(function (segment, index) {
                    let config = configSegments['route'];
                    if (!routeA1 && index === 0) {
                        config = configSegments['first_route'];
                    }
                    if (segment.name === 'segment_1') {
                        config = configSegments['segment_1'];
                    }
                    if (index === segmentsLastIndex) {
                        if (!routeB2) {
                            config = configSegments['last_route_wo_b2'];
                        }
                        else {
                            config = configSegments['last_route'];
                        }
                    }
                    let row = {
                        name: segment.name,
                        title: segment.title,
                        statuses: config.statuses,
                        description: config.description,
                        default_statuses: config.default_statuses
                    };
                    templateRows.push(row);
                });
                if (routeB2) {
                    const config = configSegments['b2'];
                    let row = {
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
            getCurrentRouteConfig(routeName, segments) {
                const configSegments = _context.config.segments;
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
                const segmentsLastIndex = segments.length - 1;
                let notSet = true;
                segments.forEach(function (segment, index) {
                    if (routeName !== 'a1' && segment.name === routeName && index === 0) {
                        config = configSegments['first_route'];
                        notSet = false;
                    }
                    if (notSet && segment.name === routeName && segment.name === 'segment_1') {
                        config = configSegments['segment_1'];
                        notSet = false;
                    }
                    if (notSet && segment.name === routeName && index === segmentsLastIndex) {
                        if (routeName !== 'b2') {
                            config = configSegments['last_route_wo_b2'];
                        }
                        else {
                            config = configSegments['last_route'];
                        }
                        notSet = false;
                    }
                });
                return config;
            }
            getRouteConfig(causedRouteName, nextRouteName, segments) {
                const configSegments = _context.config.segments;
                const segmentsLastIndex = segments.length - 1;
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
                    let config;
                    segments.forEach(function (segment, index) {
                        if (segment.name === nextRouteName && index === segmentsLastIndex) {
                            config = configSegments['last_route'];
                        }
                    });
                    if (config) {
                        return config;
                    }
                    return configSegments['route'];
                }
                let config = configSegments['route'];
                segments.forEach(function (segment, index) {
                    let notSet = true;
                    if (notSet && nextRouteName !== 'a1' && index === 0) {
                        config = configSegments['first_route'];
                        notSet = false;
                    }
                    if (notSet && segment.name === 'segment_1') {
                        config = configSegments['segment_1'];
                        notSet = false;
                    }
                    if (notSet && index === segmentsLastIndex) {
                        if (nextRouteName !== 'b2') {
                            config = configSegments['last_route_wo_b2'];
                        }
                        else {
                            config = configSegments['last_route'];
                        }
                        notSet = false;
                    }
                });
                return config;
            }
            getRouteSegments = () => {
                const segmentsArr = [];
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
            };
            addEvents = () => {
                this.detectFlightDateChanges();
                this.detectFlightNumberChanges();
                this.detectRouteDeclarationsChanges();
                this.detectRouteStatusChanges();
                this.detectCauseSelectorChanges();
            };
            copyRoutesToSegments = async () => {
                const fieldsUpdate = [];
                for (let i = 1; i < 8; i++) {
                    const segmentValue = this.normalizeRouteValue(Custom.getFieldValue('air_route_' + i));
                    if (segmentValue) {
                        const fieldUpdate = {
                            id: _context.mappingByCode[`segment_${i}`].id,
                            value: segmentValue,
                        };
                        fieldsUpdate.push(fieldUpdate);
                    }
                }
                await Custom.updateLeadFields(fieldsUpdate);
            };
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
                let tdWithTextIndex = 0;
                for (let i = tdCountMinus1; i >= 0; i--) {
                    console.log($textTDsArr[i]['innerText']);
                    if ($textTDsArr[i]['innerText'].trim() !== '' && $textTDsArr[i]['innerText'].trim() !== 'забронировано') {
                        tdWithTextIndex = i;
                        break;
                    }
                    else {
                        jQuery($colorTDsArr[i]).css({ "background": defaultBackground, "border-right": `1px solid ${defaultBackground}` });
                    }
                }
                $colorTDs.each(function (index, el) {
                    const $el = $(el);
                    const $textTd = $($textTDsArr[index]);
                    const selectedStatusId = $textTd.attr('data-selected-status-id');
                    const selectedStatusBackground = $textTd.attr('data-selected-status-background');
                    if (selectedStatusId === 'reserved') {
                        $el.css({ "background": selectedStatusBackground, "border-right": `1px solid ${selectedStatusBackground}` });
                    }
                });
                _logger.dev('tdWithTextIndex = ', tdWithTextIndex);
                $colorTDs.each(function (index, el) {
                    const $textTd = $($textTDsArr[index]);
                    const routeName = $textTd.attr('data-route-name');
                    const finalStatusValue = $textTd.attr('data-final-status-value');
                    const finalStatusId = $textTd.attr('data-final-status-id');
                    const relevantSelect = jQuery(`#row-status-selector-${routeName} select`);
                    if (index < tdWithTextIndex) {
                        const $el = $(el);
                        $el.css({ "background": defaultDoneBackground, "border-right": `1px solid ${defaultDoneBackground}` });
                        if ($textTd.text().trim() === '') {
                            relevantSelect.val(finalStatusId);
                            relevantSelect.select2({
                                placeholder: "выбрать",
                                allowClear: true,
                                minimumResultsForSearch: Infinity
                            });
                        }
                    }
                });
            };
            removeSelectClearBug = (elem) => {
                elem.on("select2:clear", function (evt) {
                    $(this).on("select2:opening.cancelOpen", function (evt) {
                        evt.preventDefault();
                        $(this).off("select2:opening.cancelOpen");
                    });
                });
            };
            populateStatuses = ($elem, selectedStatusId, selectedRouteName) => {
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
                    $selector.css({ "background": selectedBackground, "border-right": `1px solid ${selectedBackground}` });
                    $tdText.attr('data-selected-status-background', selectedBackground);
                    $tdText.attr('data-selected-status-text', selectedText);
                    $tdText.text(selectedText);
                }
                if ((selectedRouteName === 'a1' && selectedStatusId === 'car_reserved')) {
                    return;
                }
                if (elemIndex !== 0 && statusesType === 'default_statuses') {
                    if (nextSelectedOption === '' || nextSelectedOption === undefined) {
                        const defaultBackground = _context.config.default_background;
                        const selector = `#${selectedRouteName}-progress-color`;
                        const $selector = $(selector);
                        $selector.css({ "background": defaultBackground, "border-right": `1px solid ${defaultBackground}` });
                        $tdText.attr('data-selected-status-background', defaultBackground);
                    }
                    return;
                }
                if (selectedStatusId !== finalStatusId || selectedOptionValue === undefined || selectedOptionValue === '' || selectedStatusId === 'reserved') {
                    routeStatuses = routeConfig.default_statuses;
                    statusType = 'default_statuses';
                    placeholder = "сброшен";
                    $nextSelect.select2('destroy').html('').trigger('change');
                    resetStatus = true;
                }
                console.log({ nextRouteName });
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
                $nextSelect.select2({
                    data: selectData,
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
                $nextSelect.val(nextSelectedOption);
                if (selectedRouteName === 'a1') {
                    const oldSelectedValue = $nextSelect.val();
                    if (oldSelectedValue === '' && selectedStatusId === 'on_delivery') {
                        $nextSelect.val('waiting');
                    }
                    else {
                    }
                }
                if (selectedRouteName === 'a11') {
                    const oldSelectedValue = $nextSelect.val();
                    if (oldSelectedValue !== 'flew_out' && selectedStatusId === 'handed_over') {
                        $nextSelect.val('airport');
                    }
                    else {
                    }
                }
                $nextSelect.attr('data-statuses-type', statusType);
                $nextSelect.trigger('change');
            };
            detectRouteStatusChanges = () => {
                const _this = this;
                const defaultBackground = _context.config.default_background;
                $('.row-status-selector select').each(function () {
                    const elem = $(this);
                    _this.removeSelectClearBug(elem);
                    if (!elem.hasClass('processed')) {
                        elem.on("change", function (event) {
                            elem.addClass('processed');
                            const selectedOption = elem.find('option:selected');
                            const selectedValue = selectedOption.val();
                            const routeNameAttr = elem.parents('.row-status-selector').attr('id');
                            const routeName = routeNameAttr.split('row-status-selector-')[1];
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
                                $(`#${routeName}-progress-color`).css({ background, "border-right": `1px solid ${background}` });
                                $progressText.text(selectedText);
                                $progressText.attr('data-selected-status-id', selectedValue);
                                $progressText.attr('data-selected-status-text', selectedText);
                                $progressText.attr('data-selected-status-background', background);
                                _this.generateBtnDecorDefault();
                                _this.runEnableBtnActions(elem);
                                _this.colorProgressTable();
                                return;
                            }
                            if (routeName === 'a11') {
                                if (selectedValue === 'handed_over') {
                                    let progressText = '', progressBackground = '';
                                    routesStatuses.forEach(function (item, index) {
                                        if (item.id === 'airport') {
                                            progressText = item.value;
                                            progressBackground = item.background;
                                        }
                                    });
                                    const $segment1selectedOption = $('#row-status-selector-segment_1 select');
                                    $('#segment_1-progress-text').text('в аэропорту');
                                    const background = '#a7e4a8';
                                    $('#segment_1-progress-color').css({ background, "border-right": `1px solid ${background}` });
                                    $('#segment_1-progress-text').attr('data-selected-status-id', 'airport');
                                    _this.colorProgressTable();
                                }
                            }
                            else {
                                const selectedText = selectedOption.text().trim();
                                if (selectedText === '') {
                                    background = defaultBackground;
                                }
                                if (selectedValue !== 'reserved' && routeName !== 'a1') {
                                    const $segmentA11Select = $('#row-status-selector-a11 select');
                                    const $segmentA11SelectedValue = $segmentA11Select.find('option:selected').val();
                                    if ($segmentA11SelectedValue !== 'handed_over') {
                                    }
                                }
                                $(`#${routeName}-progress-color`).css({ background, "border-right": `1px solid ${background}` });
                                $progressText.text(selectedText);
                                $progressText.attr('data-selected-status-id', selectedValue);
                                $progressText.attr('data-selected-status-text', selectedText);
                            }
                            _this.runEnableBtnActions(elem);
                            _this.colorProgressTable();
                        });
                    }
                });
            };
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
                        const routeNameAttr = elem.parents('.row-status-selector').attr('id');
                        const routeName = routeNameAttr.split('row-status-selector-')[1];
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
                            $(`#${routeName}-progress-color`).css({ background, "border-right": `1px solid ${background}` });
                            $progressText.text(selectedText);
                            $progressText.attr('data-selected-status-id', selectedValue);
                            $progressText.attr('data-selected-status-text', selectedText);
                            $progressText.attr('data-selected-status-background', background);
                            _this.generateBtnDecorDefault();
                            _this.runEnableBtnActions(elem);
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
                                $('#segment_1-progress-text').text('в аэропорту');
                                const background = '#a7e4a8';
                                $('#segment_1-progress-color').css({ background, "border-right": `1px solid ${background}` });
                                $('#segment_1-progress-text').attr('data-selected-status-id', 'airport');
                                _this.colorProgressTable();
                            }
                        }
                        else {
                            const selectedText = selectedOption.text().trim();
                            if (selectedText === '') {
                                background = defaultBackground;
                            }
                            $(`#${routeName}-progress-color`).css({ background, "border-right": `1px solid ${background}` });
                            $progressText.text(selectedText);
                            $progressText.attr('data-selected-status-id', selectedValue);
                            $progressText.attr('data-selected-status-text', selectedText);
                        }
                        _this.runEnableBtnActions(elem);
                        _this.colorProgressTable();
                    }
                });
            };
            static setSelect2Value($select, value) {
                $select.val(value);
                $select.select2({
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
                        }
                        else {
                            customCauseInput.hide();
                        }
                        _this.runEnableBtnActions();
                    });
                });
            };
            detectFlightDateChanges = () => {
                const _this = this;
                $('.flight-date input').each(function () {
                    const elem = $(this);
                    if (!elem.hasClass('flight-date-change-bind')) {
                        elem.bind("change", function (event) {
                            elem.addClass('flight-date-change-bind');
                            _this.inputChangesHandler(elem);
                            _this.updateProgressTableRows(elem);
                            elem.parents('.segment-group-row-value').attr('data-changed-value', true);
                        });
                    }
                    _this.updateProgressTableRows(elem);
                });
            };
            updateProgressTableRows = (elem) => {
                const elemValue = elem.val();
                let elemType = 'date';
                if (elem.hasClass('flight-number')) {
                    elemType = 'flight';
                }
                const parent = elem.parents('tbody');
                const segmentName = parent.attr('data-segment-name');
                if (!['a11', 'b2'].includes(segmentName)) {
                    const progressTd = $(`.progress-table-${elemType}-row td[data-route-name="${segmentName}"]`);
                    progressTd.text(elemValue);
                }
            };
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
            };
            detectRouteDeclarationsChanges = () => {
                const _this = this;
                $('input.route-declaration').each(function () {
                    const elem = $(this);
                    elem.on("input keyup paste", function (event) {
                        _this.inputChangesHandler(elem);
                    });
                });
            };
            inputChangesHandler = (elem) => {
                const initValue = elem.parents('.segment-group-row-value').attr('data-init-value');
                const changedValue = elem.parents('.segment-group-row-value').attr('data-changed-value');
                if (initValue || changedValue) {
                    const $group = elem.parents('.segment-group');
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
                    }
                    else {
                        if ($selectorWrapper) {
                            $selectorWrapper.hide().removeClass(`${this.widgetName}-cause-selected`);
                        }
                        this.runDisableBtnActions(elem);
                    }
                }
                else {
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
            };
            runDisableBtnActions = (elem) => {
                const id = elem.attr('id');
                const index = this.enableEventsCounter.indexOf(id);
                if (index > -1) {
                    this.enableEventsCounter.splice(index, 1);
                }
                _logger.dev('counter--', this.enableEventsCounter);
                if (this.enableEventsCounter.length === 0) {
                    this.$generateBtn.trigger('button:save:disable').prop('disabled', true);
                }
                this.removeValidateErrorSelectStatus(elem);
                elem.removeClass(`${this.widgetName}-input-value-changed`);
            };
            addEventCounter = (elem) => {
                if (elem) {
                    const id = elem.attr('id');
                    if (!this.enableEventsCounter.includes(id)) {
                        this.enableEventsCounter.push(id);
                    }
                    elem.addClass(`${this.widgetName}-input-value-changed`);
                }
            };
            getStatusSelectedValue = (elem) => {
                const $group = elem.parents('.segment-group');
                const $row = $group.find('.segment-group-row.segment-status');
                const $select = $row.find('.row-status-selector select');
                const selectedOption = $select.find('option:selected');
                const selectedValue = selectedOption.val();
                return selectedValue;
            };
            getStatusSelectRow = (elem) => {
                const $group = elem.parents('.segment-group');
                const $row = $group.find('.segment-group-row.segment-status');
                return $row;
            };
            validateSelectStatus = (elem) => {
                const $row = this.getStatusSelectRow(elem);
                const selectedValue = this.getStatusSelectedValue(elem);
                let elemVal = elem.val();
                const flightNumberVal = elem.parents('tbody').find('input.flight-number').val();
                const flightDateVal = elem.parents('tbody').find('input.date_field').val();
                if (elemVal === flightNumberVal || elemVal === flightDateVal) {
                    elemVal = '';
                }
                const changedInput = !!flightDateVal || !!flightNumberVal;
                if (changedInput && (!selectedValue && !elemVal)) {
                    $row.addClass('nika-select2-preflight-required');
                }
                else {
                    $row.removeClass('nika-select2-preflight-required');
                    $row.removeClass('nika-select2-required');
                }
            };
            removeValidateErrorSelectStatus = (elem) => {
                const $row = this.getStatusSelectRow(elem);
                $row.removeClass('nika-select2-required');
                $row.removeClass('nika-select2-preflight-required');
            };
            markTriggeredElem = (elem) => {
                const triggeredClass = `${this.widgetName}-triggered-element`;
                jQuery(`.${triggeredClass}`).removeClass(triggeredClass);
                elem.addClass(triggeredClass);
            };
            runEnableBtnActions = (elem) => {
                if (elem) {
                    this.addEventCounter(elem);
                    this.validateSelectStatus(elem);
                    this.markTriggeredElem(elem);
                }
                this.generateBtnDecorDefault();
            };
            initFormElements = () => {
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
                jQuery('.cause-selector').select2({
                    placeholder: "выбрать",
                    templateResult: template,
                    templateSelection: template,
                    allowClear: true,
                    escapeMarkup: function (markup) {
                        return markup;
                    }
                });
                this.$generateBtn = $(`#${this.widgetName}_generate-button`);
                this.$generateBtn.trigger('button:save:disable').prop('disabled', true);
            };
            getLastFilledInputWithStatus = () => {
                const _this = this;
                const $aeroSegments = $('.segment-group').not('#segment-group-MAWB').filter(function () {
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
            };
            isCurrentGroupIsLast = (elem) => {
                let result = false;
                const $lastFilledInput = this.getLastFilledInputWithStatus();
                if (elem && $lastFilledInput.length > 0) {
                    const $lastFilledGroup = $lastFilledInput.parents('.segment-group');
                    const $currentGroup = elem.parents('.segment-group');
                    result = $lastFilledGroup[0] === $currentGroup[0];
                }
                return result;
            };
            getLastChangedHTMLEntities = () => {
                const addedClass = `${this.widgetName}-input-value-changed`;
                let lastChangedFlightNumber, lastChangedFlightDate;
                const $lastChangedInput = $(`input.${addedClass}`).last();
                let dateCauseValue, numberCauseValue;
                const isCurrentIsLastOne = this.isCurrentGroupIsLast($lastChangedInput);
                const $lastFilledInput = this.getLastFilledInputWithStatus();
                const segmentParent = $lastChangedInput.parents('.segment-group');
                if (isCurrentIsLastOne) {
                    if ($lastChangedInput.hasClass('flight-number')) {
                        lastChangedFlightNumber = $lastChangedInput;
                        const neighbourDateInput = segmentParent.find('.date_field');
                        if (neighbourDateInput.hasClass(addedClass)) {
                            lastChangedFlightDate = neighbourDateInput;
                            dateCauseValue = this.getCauseValueForInput(lastChangedFlightDate);
                        }
                        numberCauseValue = this.getCauseValueForInput($lastChangedInput);
                    }
                    if ($lastChangedInput.hasClass('date_field')) {
                        lastChangedFlightDate = $lastChangedInput;
                        const neighbourNumberInput = segmentParent.find('.flight-number');
                        if (neighbourNumberInput.hasClass(addedClass)) {
                            lastChangedFlightNumber = neighbourNumberInput;
                            numberCauseValue = this.getCauseValueForInput(lastChangedFlightNumber);
                        }
                        dateCauseValue = this.getCauseValueForInput($lastChangedInput);
                    }
                }
                else {
                    const $segmentParent = $lastFilledInput.parents('.segment-group');
                    lastChangedFlightDate = $segmentParent.find('.date_field');
                    lastChangedFlightNumber = $segmentParent.find('.flight-number');
                }
                const segmentName = segmentParent.find('.segment-group-header-value').text();
                return { dateCauseValue, numberCauseValue, lastChangedFlightNumber, lastChangedFlightDate, segmentName };
            };
            updateFieldsByGenerateBtn = async (code) => {
                const fieldsValues = Custom.getFormFieldsValues();
                const fieldsUpdate = {
                    id: _context.mappingByCode['control_template_code'].id,
                    value: code['control_template_code'],
                };
                fieldsValues.push(fieldsUpdate);
                fieldsValues.push({
                    id: _context.mappingByCode['control_template_code_2'].id,
                    value: code['control_template_code_2'],
                });
                await Custom.updateLeadFields(fieldsValues);
            };
            generateBtnDecorDefault = () => {
                const btn = this.$generateBtn;
                btn.removeClass('btn-validation-error');
                btn.trigger('button:save:enable').prop('disabled', false);
                btn.text(_context.config.btn_text.init);
            };
            generateBtnDecorStart = (btn) => {
                btn.removeClass('btn-validation-error');
                const oldTitle = btn.text();
                btn.attr('data-old-title', oldTitle);
                btn.text(_context.config.btn_text.progress);
                btn.trigger('button:load:start');
                btn.find('.button-input__spinner').css({
                    'display': 'inline-block',
                    'left': '10px',
                    'padding-left': '10px'
                });
                btn.prop('disabled', true);
            };
            generateBtnDecorError = (btn, msg) => {
                const oldTitle = btn.text();
                btn.attr('data-old-title', oldTitle);
                btn.text(msg);
                btn.addClass('btn-validation-error');
                btn.prop('disabled', true);
            };
            generateBtnDecorStop = (btn) => {
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
            };
            renderPreview = (code) => {
                jQuery(`#${this.widgetName}-code-preview`).remove();
                jQuery(`#nika-${this.widgetName}-base-form`).append(`<div id="${this.widgetName}-code-preview"><div><strong>Предпросмотр кода шаблона</strong></div>${code}</div>`);
            };
            resetFormState = () => {
                const changeFlagClass = `${this.widgetName}-input-value-changed`;
                const triggeredClass = `${this.widgetName}-triggered-element`;
                jQuery(`.${changeFlagClass}`).removeClass(changeFlagClass);
                jQuery(`.${triggeredClass}`).removeClass(triggeredClass);
                const l = jQuery(changeFlagClass).length;
                $('.row-cause-selector .cause-selector-wrapper').hide();
            };
            validateInputs = () => {
                const $preflights = jQuery('.nika-select2-preflight-required');
                if ($preflights.length > 0) {
                    $preflights.addClass('nika-select2-required');
                    return false;
                }
                return true;
            };
            generateCodeActions = async (btn) => {
                if (!this.validateInputs()) {
                    this.generateBtnDecorError(btn, _context.config.btn_text.error.validation);
                    _logger.dev('Ошибка валидации');
                    return;
                }
                this.generateBtnDecorStart(btn);
                const { dateCauseValue, numberCauseValue, lastChangedFlightNumber, lastChangedFlightDate, segmentName } = this.getLastChangedHTMLEntities();
                let controlTemplateCode = this.generateHtmlCode(dateCauseValue, numberCauseValue, lastChangedFlightNumber, lastChangedFlightDate, segmentName);
                let controlTemplateCode2 = this.generateHtmlCodeA11();
                await this.updateFieldsByGenerateBtn({ 'control_template_code': controlTemplateCode, 'control_template_code_2': controlTemplateCode2 });
                this.renderPreview(controlTemplateCode);
                this.resetFormState();
                this.generateBtnDecorStop(btn);
            };
            generateHtmlCode(dateCauseValue, numberCauseValue, lastChangedFlightNumber, lastChangedFlightDate, segmentName) {
                let code = this.generateProgressRoutesCode(segmentName);
                code += this.generateCausedByCode(dateCauseValue, numberCauseValue, segmentName);
                code += this.generateFlightDateNumberCode(lastChangedFlightNumber, lastChangedFlightDate);
                return code;
            }
            generateHtmlCodeA11() {
                let spanCargoInAirport = '';
                const segmentA11selectedOption = $('#row-status-selector-segment_1 select option:selected').val();
                const a11Date = $('.segment-group-a11 input.date_field').val();
                const allSelectedStatuses = $('.row-status-selector').not('#row-status-selector-a1').find('select' +
                    ' option:selected');
                if (a11Date) {
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
            generateProgressRoutesCode = (segmentName) => {
                let html = jQuery(`#${this.widgetName}-progress-table`)[0].outerHTML;
                html = html.replace(/[\n\r]/g, "");
                const $html = jQuery(html);
                const tableId = $html.attr('id');
                $html.addClass('progress-table-render-preview');
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
            };
            getCauseValueForInput = (lastChangedInput) => {
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
                        const customCause = parentRow.find('.custom-cause');
                        causeValue = customCause.val();
                        causeValue = causeValue;
                        causeValue = causeValue.trim();
                    }
                }
                return causeValue;
            };
            generateCausedByCode = (dateCauseValue, numberCauseValue, segmentName) => {
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
            };
            generateFlightDateNumberCode = (flightNumberElem, flightDateElem) => {
                let spanFlightNumber = '';
                let spanFlightDate = '';
                let spanMAWB = '';
                let flightNumber = typeof flightNumberElem !== "undefined" ? flightNumberElem.val() : '';
                let flightDate = typeof flightDateElem !== "undefined" ? flightDateElem.val() : '';
                const MAWB = $('#segment-group-MAWB .segment-group-row-value input').val();
                {
                    if (!flightNumber && !flightDate) {
                        const $lastSelectedStatusElem = $('.row-status-selector select option:selected').filter(function () {
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
                {
                    if (flightNumberElem && !flightDateElem) {
                        const $parentGroup = flightNumberElem.parents('.segment-group');
                        const $flightDateElem = $parentGroup.find('.segment-flight-date input.date_field');
                        const flightDateVal = $flightDateElem.val();
                        if (flightDateVal) {
                            flightDate = flightDateVal;
                        }
                    }
                    if (flightDateElem && !flightNumberElem) {
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
            };
        }
        return new ControlBlock();
    };
});
