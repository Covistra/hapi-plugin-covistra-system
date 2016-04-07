
module.exports = function(server, config, log) {

    return {
        inject: function(path) {
            return require(path)(server, config, log);
        }
    }
};
