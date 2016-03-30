var Joi = require('joi');

module.exports = function(server) {

    var TemplateEngine = server.plugins['covistra-system'].TemplateEngine;

    var service = function(msg) {
        return TemplateEngine.renderTemplate(msg.id, msg.data, msg.options);
    };

    return {
        pattern: {role:'system', target: 'template', action: 'render'},
        schema: Joi.object().keys({
            id: Joi.string().description('Template id used to refer to this template'),
            data: Joi.object().description('Data consumed by the template'),
            options: Joi.object().keys({
                source: Joi.string().description('Force a specific template source to be used')
            })
        }),
        callback: service
    }
};
