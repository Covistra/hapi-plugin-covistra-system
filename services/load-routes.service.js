
module.exports = function(server) {

    var service = function(msg) {
        return server.plugins['covistra-system'].Router.routes(server, msg.routePath);
    };

    return {
        pattern: {role:'system', target: 'router', action: 'load'},
        callback: service
    }
};
