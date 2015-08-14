var P = require('bluebird'),
    _ = require('lodash');
module.exports = function(server, log, config) {

    var checkDepsTimeout = config.get('plugins:system:check_deps_timeout', 3000);

    return function(name) {
        return new P(function(resolve) {
            function checkDeps() {
                if(server.plugins[name]) {
                    resolve(server.plugins[name]);
                }
                else {
                    setTimeout(checkDeps, 100);
                }
            }

            if(server.plugins[name]) {
                resolve(server.plugins[name]);
            }
            else {
                setTimeout(checkDeps, 100);
            }

        }).timeout(checkDepsTimeout);
    }
};
