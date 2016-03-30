var Joi = require('joi');

module.exports = function(server) {

    var TemplateEngine = server.plugins['covistra-system'].TemplateEngine;

    var service = function(msg) {
        return TemplateEngine.getTemplate(msg.id);
    };

    return {
        pattern: {role:'system', target: 'template', action: 'get'},
        schema: Joi.object().keys({
            id: Joi.string().description('Id of the template to retrieve')
        }),
        callback: service
    }
};
