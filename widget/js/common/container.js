'use strict';
define(['underscore'], function (_) {
    const objects = {};
    const factories = [];
    const Container = {
        get: undefined,
        set: undefined,
        factory: undefined
    };
    let ContainerProxy = {};
    Container.get = function (key) {
        const isFactory = factories.indexOf(key) !== -1;
        if (!objects[key]) {
            throw new Error('Object "%s" not found in Container'.replace('%s', key));
        }
        if (!isFactory && typeof objects[key] === 'function') {
            objects[key] = objects[key](ContainerProxy);
        }
        if (isFactory) {
            return factory(objects[key], _.toArray(arguments[1]));
        }
        return objects[key];
    };
    function factory(obj, args) {
        args.unshift(ContainerProxy);
        return obj.apply(ContainerProxy, args);
    }
    Container.set = function (key, value) {
        objects[key] = value;
    };
    Container.factory = function (key, value) {
        if (typeof value !== 'function') {
            throw new Error('Value for "%s" is not a function'.replace('%s', key));
        }
        this.set(key, value);
        factories.push(key);
    };
    ContainerProxy = new Proxy(Container, {
        get: function get(target, property) {
            if (target.hasOwnProperty(property)) {
                return target[property];
            }
            if (typeof property === "string" && property.substring(0, 3) === 'get') {
                let service = property.substring(3, property.length);
                service = service.replace(/([A-Z])/g, function ($1) {
                    return '_' + $1.toLowerCase();
                });
                if (service.slice(0, 1) === '_') {
                    service = service.slice(1);
                }
                return function () {
                    return Container.get(service, arguments);
                };
            }
        },
    });
    return ContainerProxy;
});
