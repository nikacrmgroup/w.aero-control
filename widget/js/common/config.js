'use strict';
define(['json!../../manifest.json', 'underscore'], function (manifest, _) {
    return function (widget) {
        const colors = {
            'yellow': '#ffff00',
            'light_green': '#92d050',
            'green': '#00b050',
        };
        return {
            debug: true,
            widget: {
                ver: manifest.widget.version,
                code: widget.params.widget_code,
                name: 'aero-control',
                caption_title: 'Управление перевозкой',
                caption_button_text: 'Управление перевозкой',
            },
            default_background: '#f2f2f2',
            default_done_background: '#00b050',
            btn_text: {
                'init': 'Обновить данные',
                'progress': 'Обновляем',
                'success': 'Готово 😀',
                'error': {
                    'validation': 'Ошибка заполнения 😑',
                }
            },
            causes: [
                {
                    id: 'cause_1',
                    value: 'Высокая коммерческая загрузка (для подробной информации перейдите по <a href="https://logistics_customs.academic.ru/204/%D0%97%D0%90%D0%93%D0%A0%D0%A3%D0%97%D0%9A%D0%90_%D0%A1%D0%90%D0%9C%D0%9E%D0%9B%D0%95%D0%A2%D0%90_%D0%9A%D0%9E%D0%9C%D0%9C%D0%95%D0%A0%D0%A7%D0%95%D0%A1%D0%9A%D0%90%D0%AF" title="ссылке">ссылке</a>)',
                    html: "Высокая коммерческая загрузка (для подробной информации перейдите по <a href='https://logistics_customs.academic.ru/204/%D0%97%D0%90%D0%93%D0%A0%D0%A3%D0%97%D0%9A%D0%90_%D0%A1%D0%90%D0%9C%D0%9E%D0%9B%D0%95%D0%A2%D0%90_%D0%9A%D0%9E%D0%9C%D0%9C%D0%95%D0%A0%D0%A7%D0%95%D0%A1%D0%9A%D0%90%D0%AF' title='ссылке'>ссылке</a>)",
                },
                {
                    id: 'cause_2',
                    value: 'Отмена рейса',
                },
                {
                    id: 'cause_3',
                    value: 'Перенос рейса',
                },
                {
                    id: 'cause_4',
                    value: 'Перенос рейса по причине незагрузки ВС',
                },
                {
                    id: 'cause_5',
                    value: 'Неисправность самолета',
                },
                {
                    id: 'cause_6',
                    value: 'Неблагоприятные погодные условия',
                },
                {
                    id: 'cause_7',
                    value: 'Смена типа ВС',
                },
                {
                    id: 'custom',
                    value: 'Собственная причина',
                },
            ],
            segments: {
                'a1': {
                    'description': 'доставка в аэропорт',
                    'statuses': [
                        {
                            'id': 'car_reserved',
                            'value': 'машина заказана',
                            'background': colors.yellow,
                        },
                        {
                            'id': 'on_delivery',
                            'value': 'на доставке',
                            'background': colors.light_green,
                        }
                    ],
                    'default_statuses': [
                        {
                            'id': 'car_reserved',
                            'value': 'машина заказана',
                            'background': colors.yellow,
                        },
                        {
                            'id': 'on_delivery',
                            'value': 'на доставке',
                            'background': colors.light_green,
                        }
                    ]
                },
                'a11': {
                    'description': 'размещение груза в аэропорту вылета',
                    'statuses': [
                        {
                            'id': 'waiting',
                            'value': 'ожидание',
                            'background': '#ffee50',
                        },
                        {
                            'id': 'handed_over',
                            'value': 'груз сдан',
                            'background': '#00BCD4',
                        }
                    ],
                    'default_statuses': [
                        {
                            'id': 'waiting',
                            'value': 'ожидание',
                            'background': '#ffee50',
                        }
                    ],
                },
                'segment_1': {
                    'description': 'сегмент',
                    'statuses': [
                        {
                            'id': 'reserved',
                            'value': 'забронировано',
                            'background': colors.yellow,
                        },
                        {
                            'id': 'airport',
                            'value': 'в аэропорту',
                            'background': colors.light_green,
                        },
                        {
                            'id': 'flew_out',
                            'value': 'вылетел',
                            'background': colors.green,
                        },
                    ],
                    'default_statuses': [
                        {
                            'id': 'reserved',
                            'value': 'забронировано',
                            'background': colors.yellow,
                        }
                    ],
                },
                'first_route': {
                    'description': 'сегмент',
                    'statuses': [
                        {
                            'id': 'reserved',
                            'value': 'забронировано',
                            'background': colors.yellow,
                        },
                        {
                            'id': 'airport',
                            'value': 'в аэропорту',
                            'background': colors.light_green,
                        },
                        {
                            'id': 'flew_out',
                            'value': 'вылетел',
                            'background': colors.green,
                        },
                    ],
                    'default_statuses': [
                        {
                            'id': 'reserved',
                            'value': 'забронировано',
                            'background': colors.yellow,
                        }
                    ],
                },
                'route': {
                    'description': 'сегмент',
                    'statuses': [
                        {
                            'id': 'reserved',
                            'value': 'забронировано',
                            'background': colors.yellow,
                        },
                        {
                            'id': 'arrived',
                            'value': 'прилетел',
                            'background': colors.light_green,
                        },
                        {
                            'id': 'airport',
                            'value': 'в аэропорту',
                            'background': colors.light_green,
                        },
                        {
                            'id': 'flew_out',
                            'value': 'вылетел',
                            'background': colors.green,
                        },
                    ],
                    'default_statuses': [
                        {
                            'id': 'reserved',
                            'value': 'забронировано',
                            'background': colors.yellow,
                        }
                    ],
                },
                'last_route': {
                    'description': 'сегмент',
                    'statuses': [
                        {
                            'id': 'reserved',
                            'value': 'забронировано',
                            'background': colors.yellow,
                        },
                        {
                            'id': 'arrived',
                            'value': 'прилетел',
                            'background': colors.green,
                        },
                    ],
                    'default_statuses': [
                        {
                            'id': 'reserved',
                            'value': 'забронировано',
                            'background': colors.yellow,
                        }
                    ],
                },
                'last_route_wo_b2': {
                    'description': 'сегмент',
                    'statuses': [
                        {
                            'id': 'reserved',
                            'value': 'забронировано',
                            'background': colors.yellow,
                        },
                        {
                            'id': 'arrived',
                            'value': 'прилетел',
                            'background': colors.green,
                        },
                    ],
                    'default_statuses': [
                        {
                            'id': 'reserved',
                            'value': 'забронировано',
                            'background': colors.yellow,
                        }
                    ],
                },
                'b2': {
                    'description': 'доставка до получателя',
                    'statuses': [
                        {
                            'id': 'on_delivery',
                            'value': 'на доставке',
                            'background': colors.light_green,
                        },
                        {
                            'id': 'delivered',
                            'value': 'доставлен',
                            'background': colors.green,
                        }
                    ],
                    'default_statuses': []
                },
            },
            mapping: {
                'auto_route_a1': 'Маршрут авто А1',
                'auto_route_b2': 'Маршрут авто Б2',
                'air_route_1': 'Маршрут авиа 1',
                'air_route_2': 'Маршрут авиа 2',
                'air_route_3': 'Маршрут авиа 3',
                'air_route_4': 'Маршрут авиа 4',
                'air_route_5': 'Маршрут авиа 5',
                'air_route_6': 'Маршрут авиа 6',
                'air_route_7': 'Маршрут авиа 7',
                'MAWB': 'MAWB',
                'HAWB': 'HAWB',
                'segment_1': 'Сегмент 1',
                'segment_2': 'Сегмент 2',
                'segment_3': 'Сегмент 3',
                'segment_4': 'Сегмент 4',
                'segment_5': 'Сегмент 5',
                'segment_6': 'Сегмент 6',
                'segment_7': 'Сегмент 7',
                'segment_1_flight_number': 'Рейс 1',
                'segment_2_flight_number': 'Рейс 2',
                'segment_3_flight_number': 'Рейс 3',
                'segment_4_flight_number': 'Рейс 4',
                'segment_5_flight_number': 'Рейс 5',
                'segment_6_flight_number': 'Рейс 6',
                'segment_7_flight_number': 'Рейс 7',
                'segment_1_flight_date': 'Дата 1',
                'segment_2_flight_date': 'Дата 2',
                'segment_3_flight_date': 'Дата 3',
                'segment_4_flight_date': 'Дата 4',
                'segment_5_flight_date': 'Дата 5',
                'segment_6_flight_date': 'Дата 6',
                'segment_7_flight_date': 'Дата 7',
                'control_block_code': 'Код КОНТРОЛЯ',
                'control_template_code': 'Код КОНТРОЛЯ.ШАБЛОН',
                'a1_flight_date': 'Дата подачи машины',
                'a11_flight_date': 'Дата размещения груза в аэропорту вылета',
                'control_template_code_2': 'Код КОНТРОЛЯ.ШАБЛОН 2',
            },
        };
    };
});
