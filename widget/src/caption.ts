'use strict';
declare var AMOCRM: any
define(['jquery', 'lib/components/base/modal'], function ($, Modal) {
    return function (_context, _form) {
        class Caption {
            isLeadCard = () => {

                let data = AMOCRM.data;
                return data.is_card && (data.current_entity === 'leads') &&
                    data.current_card.id;
            };

            preRender = function () {
                _context.widget.render_template({
                    caption: {class_name: `${_context.config.widget.name}-caption`},
                    body: '',
                    render: '',
                });
            };

            addCaption = () => {
                if (this.isLeadCard()) {
                    let caption = `<div class="${_context.config.widget.name}-caption-wrap">
        <div class="${_context.config.widget.name}-btn" title="${_context.config.widget.caption_title}">
            <div class="${_context.config.widget.name}-btn__ico"></div>
            <div class="${_context.config.widget.name}-btn__text">${_context.config.widget.caption_button_text}</div>
            <div class="${_context.config.widget.name}-btn__loader"></div>           
        </div>
        <div class="${_context.config.widget.name}-info">
         <div class="${_context.config.widget.name}-info__last_update"></div>
         <div class="${_context.config.widget.name}-info__message"></div>
        </div>
        
    </div>`;
                    $(`.${_context.config.widget.name}-caption`).replaceWith(caption);
                    this.addEvent(_context.widget);
                }

            };

            addEvent(widget) {
                /* По клику на кнопку отправляем запрос на выполнение логики */
                $(`.${_context.config.widget.name}-btn`).on('click', function (e) {
                    e.preventDefault();
                    _form.render();

                });

            }
        }

        return new Caption();

    };
});