'use strict';
define(['jquery', 'moment', 'underscore'], function ($, moment, _) {
    const getAmo = AMOCRM.constant;
    return {
        account: () => getAmo('account'),
        accountId: () => getAmo('account').id,
        accountSubdomain: () => getAmo('account').subdomain,
        user: () => getAmo('user'),
        userId: () => getAmo('user').id,
        userName: () => getAmo('user').name,
        userLogin: () => getAmo('user').login,
        userAPIkey: () => getAmo('user').api_key,
        userCellPhone: () => getAmo('user').personal_mobile,
        userAmojoId: () => getAmo('user').amojo_id,
        allUserRights: () => getAmo('user_rights'),
        userRightsCatalogs: () => getAmo('user_rights').catalogs,
        userRightsCatalogsManage: () => getAmo('user_rights').catalogs_manage,
        userRightsCompanies: () => getAmo('user_rights').companies,
        userRightsContacts: () => getAmo('user_rights').contacts,
        userRightsContact: () => getAmo('user_rights').contacts.CONTACT,
        userRightsCompany: () => getAmo('user_rights').contacts.COMPANY,
        userRightsCustomers: () => getAmo('user_rights').customers,
        userIsAdmin: () => getAmo('user_rights').is_admin,
        isFreeUser: () => getAmo('user_rights').is_free_user,
        userRightsLeads: () => getAmo('user_rights').leads,
        userRightsTags: () => getAmo('user_rights').tags,
        userRightsTasks: () => getAmo('user_rights').tasks,
        userRightsTodo: () => getAmo('user_rights').todo,
        userRightsUnsorted: () => getAmo('user_rights').unsorted,
        userRightsUsers: () => getAmo('user_rights').users,
        managers: () => getAmo('managers'),
        groups: () => getAmo('groups'),
        cardLeadIds: () => AMOCRM.data.current_card.id,
        freeUsers: () => getAmo('free_users'),
        mainPipelineId: () => getAmo('main_pipeline'),
        actionConditionOperators: () => getAmo('settings_pipeline_template_params').data.action_condition_operators,
        actions: () => getAmo('settings_pipeline_template_params').data.actions,
        actionsGroups: () => getAmo('settings_pipeline_template_params').data.actions_groups,
        activeHandlersCount: () => getAmo('settings_pipeline_template_params').data.active_handlers_count,
        conditionVariants: () => getAmo('settings_pipeline_template_params').data.condition_variants,
        createCustomerParams: () => getAmo('settings_pipeline_template_params').data.create_customer_params,
        createLeadParams: () => getAmo('settings_pipeline_template_params').data.create_lead_params,
        currentPipe: () => getAmo('settings_pipeline_template_params').data.current_pipe,
        customTaskTypes: () => getAmo('settings_pipeline_template_params').data.custom_task_types,
        delaySettings: () => getAmo('settings_pipeline_template_params').data.delay_settings,
        endpoints: () => getAmo('settings_pipeline_template_params').data.endpoints,
        handlers: () => getAmo('settings_pipeline_template_params').data.handlers,
        handlersSettingLinks: () => getAmo('settings_pipeline_template_params').data.handlers_settings_links,
        howToWorkLinks: () => getAmo('settings_pipeline_template_params').data.howtowork_links,
        limits: () => getAmo('settings_pipeline_template_params').data.limits,
        templatePipelines: () => getAmo('settings_pipeline_template_params').data.pipelines,
        statuses: () => getAmo('settings_pipeline_template_params').data.statuses,
        statusesColors: () => getAmo('settings_pipeline_template_params').data.statuses_colors,
        dp: () => getAmo('dp'),
        unsortedToken: () => getAmo('unsorted_token'),
        amoForms: () => getAmo('amoforms'),
        callStatuses: () => getAmo('call_statuses'),
        noteTypes: () => AMOCRM.note_types,
        cfTypes: () => AMOCRM.cf_types,
        cfAll: () => getAmo('account').cf,
        currentEntityData: () => AMOCRM.data,
        currentLeadStatusId: () => AMOCRM.data.current_card.model.attributes['lead[STATUS]'],
        currentPipelineLcard() {
            const card = $('#card_fields');
            return {
                'pipeline_id': Number(card.find('input[name="lead[PIPELINE_ID]"]:checked').val()),
                'status_id': Number(card.find('input[name="lead[STATUS]"]:checked').val()),
            };
        },
        currentStatusSort(pipelineId, statusId) {
            return getAmo('lead_statuses')[pipelineId]['statuses']['s_' +
                statusId].sort;
        },
        currentLeadStatus: () => {
            let card = $('#card_fields');
            return card.find('input[name="lead[STATUS]"]:checked').val();
        },
        leadResponsibleId: () => getAmo('card_element').main_user_id,
        leadResponsibleName: function (leadResponsibleId) {
            if (!leadResponsibleId) {
                leadResponsibleId = this.leadResponsibleId();
            }
            const managers = this.managers();
            return managers[leadResponsibleId].title;
        },
        leadId: () => getAmo('card_element').id,
        amoMail: () => getAmo('amomail'),
        firstContact: () => getAmo('card_element').contacts[0],
        taskTypes() {
            let custom_task_types = getAmo('task_types'), all_tasks_types = {
                1: 'Звонок',
                2: 'Встреча',
                3: 'Написать письмо',
            };
            all_tasks_types = Object.assign(all_tasks_types, custom_task_types);
            return all_tasks_types;
        },
        statusDataById(name) {
            const card = $('#card_fields');
            let pipeline_id = Number(card.find('input[name="lead[PIPELINE_ID]"]:checked').val());
            let statuses = getAmo('lead_statuses')[pipeline_id].statuses;
            let color = '';
            let status_id = false;
            let data = {
                'color': color,
                'status_id': status_id, sort: undefined
            };
            $.each(statuses, function (index, value) {
                if (value.name === name) {
                    data.status_id = value.id;
                    data.color = value.color;
                    data.sort = value.sort;
                }
            });
            return data;
        },
        getCfType(id) {
            const cfAll = this.cfAll();
            if (cfAll[id] === undefined) {
                return false;
            }
            const cfTypeId = cfAll[id]['TYPE_ID'];
            const cfTypes = this.cfTypes();
            const cfTypesPrepared = _.invert(cfTypes);
            return cfTypesPrepared[cfTypeId];
        },
        getSelectCfItems(id) {
            let items = [];
            const cfAll = this.cfAll();
            const cf = cfAll[id];
            const enums = cf['ENUMS'];
            if (enums) {
                for (const [key, value] of Object.entries(enums)) {
                    items.push({ id: key, option: value['VALUE'] });
                }
            }
            return items;
        },
        getMultiSelectCfItems(id) {
            let items = [];
            const cfAll = this.cfAll();
            const cf = cfAll[id];
            const enums = cf['ENUMS'];
            if (enums) {
                for (const [key, value] of Object.entries(enums)) {
                    items.push({ id: key, option: value['VALUE'] });
                }
            }
            return items;
        },
        getFieldDataStructure(type, id, value) {
            let structure = {
                field_id: undefined,
                values: undefined
            };
            if (type === 'numeric' && value === '') {
                value = 0;
                return false;
            }
            if (!id) {
                return false;
            }
            structure.field_id = parseInt(id);
            if (id.includes('field-json')) {
                return false;
            }
            switch (type) {
                case 'text':
                case 'numeric':
                case 'textarea':
                case 'price':
                case 'streetaddress':
                case 'url':
                    structure.values = [
                        {
                            'value': value,
                        },
                    ];
                    break;
                case 'checkbox':
                    value = Boolean(value);
                    structure.values = [
                        {
                            'value': value,
                        },
                    ];
                    break;
                case 'date':
                case 'date_time':
                case 'birthday':
                    if (value === undefined || value === '') {
                        return false;
                    }
                    else {
                        const amoDate = parseInt(moment(value, 'DD.MM.YYYY').format('X'));
                        structure.values = [
                            {
                                'value': amoDate,
                            },
                        ];
                    }
                    break;
                case 'select':
                case 'radiobutton':
                case 'category':
                    structure.values = [
                        {
                            'enum_id': parseInt(value),
                        },
                    ];
                    break;
                case 'multiselect':
                    structure.values = value;
                    break;
                case 'smart_address':
                case 'multitext':
                case 'legal_entity':
                case 'items':
                default:
                    console.log(`Sorry, not supported field type ${type}.`);
            }
            return structure;
        },
    };
});
