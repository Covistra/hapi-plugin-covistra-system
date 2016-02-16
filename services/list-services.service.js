var P = require('bluebird');

module.exports = function(server) {

    var Services = server.plugins['covistra-system'].Services;

    var service = P.method(function() {
        return Services.services;
    });

    return {
        pattern: {role:'system', target: 'service', action: 'list'},
        callback: service
    }
};
