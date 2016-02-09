
module.exports = function(server) {

    var SystemStatus = server.plugins['covistra-system'].SystemStatus;

    var service = function() {
        return SystemStatus.reportSystemStatus();
    };

    return {
        pattern: {role:'system', target: 'status', action: 'read'},
        callback: service
    }
};
