var Path = require('path');

module.exports = function(server, config, log) {

    return {
        inject: function(path) {
            return require(Path.resolve(path))(server, config, log);
        }
    }
};
