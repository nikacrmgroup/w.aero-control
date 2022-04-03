'use strict';
define(['jquery'], function ($) {
    class Utils {
        checkArea(_widget, area) {
            const currentArea = _widget.system().area;
            return area.includes(currentArea);
        }
        preparePipelines(pipelines) {
            const pipelinesArray = Object.values(pipelines);
            let that = this;
            let pipelinesToSort = [];
            pipelinesArray.forEach(function (pipeline, index) {
                const statuses = pipeline['statuses'];
                let statusesArray = Object.values(statuses);
                pipeline["statuses"] = statusesArray.sort(that.dynamicSort('sort'));
                pipelinesToSort.push(pipeline);
            });
            return pipelinesToSort.sort(that.dynamicSort('sort'));
        }
        toggleElementDisable = (el) => {
            el.prop('disabled', function (i, v) {
                return !v;
            });
        };
        dynamicSort(property) {
            let sortOrder = 1;
            if (property[0] === '-') {
                sortOrder = -1;
                property = property.substr(1);
            }
            return function (a, b) {
                const result = (a[property] < b[property]) ? -1 : (a[property] >
                    b[property]) ? 1 : 0;
                return result * sortOrder;
            };
        }
        setCache(key, value, ttl) {
            const now = new Date();
            const item = {
                value: value,
                expiry: now.getTime() + ttl,
            };
            localStorage.setItem(key, JSON.stringify(item));
        }
        getCache(key) {
            const itemStr = localStorage.getItem(key);
            if (!itemStr) {
                return null;
            }
            const item = JSON.parse(itemStr);
            const now = new Date();
            if (now.getTime() > item.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            return item.value;
        }
        getFormData($form) {
            let disabled = $form.find(':input:disabled').removeAttr('disabled');
            const unindexed_array = $form.serializeArray();
            disabled.attr('disabled', 'disabled');
            let checkBoxesObj = {};
            $('input:checkbox', $form).each(function () {
                const id = this.id;
                if (id === 'cbx_drop_master_NaN') {
                    return;
                }
                const isChecked = this.checked;
                let enumId = {};
                if (id.includes('cbx_drop_')) {
                    if (isChecked) {
                        enumId = {
                            'enum_id': parseInt(this.value),
                        };
                    }
                    if (!Array.isArray(checkBoxesObj[this.name])) {
                        checkBoxesObj[this.name] = [];
                    }
                    checkBoxesObj[this.name].push(enumId);
                }
                else {
                    if (this.name !== '') {
                        checkBoxesObj[this.name] = this.checked;
                    }
                }
            });
            let indexed_array = {};
            $.map(unindexed_array, function (n, i) {
                indexed_array[n['name']] = n['value'];
            });
            indexed_array = Object.assign(indexed_array, checkBoxesObj);
            return indexed_array;
        }
        sanitizeValue = (value) => {
            if (typeof value === 'string') {
                value = value.replace(/,/g, '.');
            }
            return value;
        };
        convertArrayToObject = (array, key) => {
            const initialValue = {};
            return array.reduce((obj, item) => {
                return {
                    ...obj,
                    [item[key]]: item,
                };
            }, initialValue);
        };
        isJsonString = (str) => {
            try {
                let json = JSON.parse(str);
                return (typeof json === 'object');
            }
            catch (e) {
                return false;
            }
        };
    }
    return new Utils();
});
