'use strict';
define(['jquery'], function($) {

  return {
    async AmoGetDataPromise(apiUrl, params) {
      return new Promise(function(resolve, reject) {
        $.get(apiUrl, params, function(data) {
          resolve(data);
        });
      });
    },
    /*Получить лид по id*/
    async getLeadsById(ids) {
      return new Promise(function(resolve, reject) {
        $.get(`/api/v2/leads?id=${ids}`).
            done(function(response) {
              resolve(response);
            }).fail(function(response) {
          reject(`Ошибка при получении сделок: ${response}`);
        });
      });
    },

    /*  getContactsForLead(leadId, callback) {
        $.get('/private/api/v2/json/contacts/links', {
          'deals_link': leadId,
        }).done(function(response) {
          callback(response);
        });
      },*/
    /*Получить список контактов сделки*/
    async getContactsLinksForLead(leadId) {
      return new Promise(function(resolve, reject) {
        $.get('/private/api/v2/json/contacts/links', {
          'deals_link': leadId,
        }).
            done(function(response) {
              resolve(response);
            }).fail(function(response) {
          reject(`Ошибка при получении контакта: ${response}`);
        });
      });
    },
    /*Получить список контактов сделки*/
    async getContactsForLead(contactId) {
      return new Promise(function(resolve, reject) {
        $.get(`/api/v4/contacts/${contactId}`).
            done(function(response) {
              resolve(response);
            }).fail(function(response) {
          reject(`Ошибка при получении контакта: ${response}`);
        });
      });
    },

    async getCompany(id) {
      return new Promise(function(resolve, reject) {
        $.get(`/api/v4/companies/${id}`).
            done(function(response) {
              resolve(response);
            }).fail(function(response) {
          reject(`Ошибка при получении компании: ${response}`);
        });
      });
    },

    /*Получить компанию сделки*/
    async getLinksForEntity(id, entity = 'leads') {
      return new Promise(function(resolve, reject) {
        $.get(`/api/v4/${entity}/${id}/links`).
            done(function(response) {
              resolve(response['_embedded']['links']);
            }).fail(function(response) {
          reject(`Ошибка при получении связей: ${response}`);
        });
      });
    },

    //Обновление поля сделки
    updateLeadField(leadId, value, field_id) {
      $.post('/api/v2/leads', {
        update: [
          {
            id: leadId,
            updated_at: new Date().getTime() / 1000 + 3,
            custom_fields: [
              {
                id: field_id,
                values: [
                  {
                    value: value,
                  },
                ],
              },
            ],
          },
        ],

      });
    },
    /**
     * Обновление полей сделки через api v4
     * @param leadId id сделки
     * @param cfValues массив моделей полей
     * @param done callback успешной операции
     * @param fail callback провала
     */
    updateLeadFieldV4(leadId, cfValues, done, fail) {
      const data =
          {
            'custom_fields_values': cfValues,
          };

      const dataString = JSON.stringify(data);
      $.ajax({
        url: `/api/v4/leads/${leadId}`,
        data: dataString,
        type: 'PATCH',
        contentType: 'application/json',
        //contentType: 'application/merge-patch+json',
        processData: false,
        dataType: 'json',
      }).done(function(response) {
        done(response);
      }).fail(function(error) {
        fail(error);
      });
    },
    /**
     * Обновление бюджета сделки через api v4
     * @param leadId id сделки
     * @param price бюджет
     * @param done callback успешной операции
     * @param fail callback провала
     */
    updateLeadPrice(leadId, price, done, fail) {
      const data =
          {
            'price': parseInt(price),
          };
      const dataString = JSON.stringify(data);
      $.ajax({
        url: `/api/v4/leads/${leadId}`,
        data: dataString,
        type: 'PATCH',
        contentType: 'application/json',
        //contentType: 'application/merge-patch+json',
        processData: false,
        dataType: 'json',
      }).done(function(response) {
        done(response);
      }).fail(function(error) {
        fail(error);
      });
    },

    /*Получить список сделок по контактам*/
    getContactsLeads(contactIds, callback) {
      $.get('/private/api/v2/json/contacts/links', {
        'contacts_link': contactIds,
      }).done(function(response) {
        callback(response);
      });
    },

    /*Прикрепить контакт к сделке*/
    addContactToLead(contacts, leadId, mainContactId, callback) {

      let updateContacts = [];
      let mainContact;

      leadId = parseInt(leadId);
      mainContactId = parseInt(mainContactId);

      for (let contactId in contacts) {
        //формируем массив контактов на прикрепление сделки
        if (contacts.hasOwnProperty(contactId)) {
          contacts[contactId].push(leadId);
          let contact = {
            'id': contactId,
            'last_modified': Math.round(Date.now() / 1000 + 100),
            'linked_leads_id': contacts[contactId],
          };
          if (parseInt(contactId) === mainContactId) {
            mainContact = contact;
          }
          else {
            updateContacts[updateContacts.length] = contact;
          }
        }
      }
      if (mainContact) {
        updateContacts.unshift(mainContact);
      }

      $.post('/private/api/v2/json/contacts/set', {
        'request': {
          'contacts': {
            'update': updateContacts,
          },
        },
      }).done(function(response) {
        callback(response);
      });
    },
    /**
     * @param {string} ids
     */
    async getTasksById(ids) {

      return await new Promise(function(resolve, reject) {
        $.get(`/api/v2/tasks?id=${ids}`).
            done(function(response) {
              resolve(response);
            }).fail(function(response) {
          reject(`Ошибка при получении задач: ${response}`);
        });
      });

    },

    /*Создать лид*/
    createLead(lead, callback) {
      $.post('/private/api/v2/json/leads/set', {
        'request': {
          'leads': {
            'add': [lead],
          },
        },
      }).done(function(response) {
        callback(response);
      });
    },

    init(message) {
      console.log(message, 'initiated!');
    },
    async pipelines() {
      let value;
      await this.AmoGetDataPromise('/api/v2/pipelines').
          then(function(data) {
            value = data['_embedded']['items'];

          });

      return value;
    },
    async getLeadsWithParams(params) {
      let value;
      await this.AmoGetDataPromise('/api/v2/leads', params).
          then(function(data) {
            value = data['_embedded']['items'];

          });

      return value;
    },
    async getTasksWithParams(params) {
      let value;

      await this.AmoGetDataPromise('/api/v2/tasks', params).
          then(function(data) {
            if (data) {
              value = data['_embedded']['items'];
            }

          });

      return value;
    },
    async getTasksWithParamsV4(params) {

      let tasks = [];
      let that = this;
      let pageLimit = 50;
      for (let p = 1; p < pageLimit; p++) {
        params.page = p;
        let value;
        await that.AmoGetDataPromise('/api/v4/tasks', params).
            then(function(data) {
              if (data) {
                value = data['_embedded']['tasks'];
              }

            });
        if (value === undefined) {
          break;
        }

        /*Мерж массивов*/

        tasks = tasks.concat(
            value.filter((item) => tasks.indexOf(item) < 0));

      }

      return tasks;
    },
  };

});