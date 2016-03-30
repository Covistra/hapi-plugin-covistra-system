var Joi = require('joi');

module.exports = function(server) {

    var TemplateEngine = server.plugins['covistra-system'].TemplateEngine;

    var service = function(msg) {
        return TemplateEngine.registerTemplate(msg.id, msg.tmpl, msg.extra, msg.options);
    };

    return {
        pattern: {role:'system', target: 'template', action: 'register'},
        schema: Joi.object().keys({
            id: Joi.string().description('Template id used to refer to this template'),
            tmpl: Joi.string().description('Content of the template'),
            extra: Joi.object().description('Extra information to register with the template. Useful for html email attachments'),
            options: Joi.object().keys({
                source: Joi.string(),
                priority: Joi.number().min(0).max(5).precision(0).default(0),
                partials: Joi.object().description('Each key is a partial that will be registered with Handlebars'),
                helpers: Joi.object().description('Each key is a helper that will be registered with Handlebars')
            })
        }),
        callback: service
    }
};
