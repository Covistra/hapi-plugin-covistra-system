
module.exports = function(server) {

    var service = function(msg) {
        return {
            id: server.plugins['covistra-system'].random.id(msg.length)
        }
    };

    return {
        pattern: {role:'system', target: 'random', action: 'generate-unique-id'},
        callback: service
    }
};
