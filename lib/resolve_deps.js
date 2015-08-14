var P = require('bluebird'),
    _ = require('lodash');
module.exports = function(server, log, config) {

    var checkDepsTimeout = config.get('plugins:system:check_deps_timeout', 3000);

    return function(name) {
        log.debug("Lazy rsolution of plugin", name);
        var timer;

        var promise = new P(function(resolve) {

            function checkDeps() {
                log.trace("Checking if plugin %s is available", name);
                if(server.plugins[name]) {
                    log.trace("Plugin %s has been loaded. Resolving it!", name);
                    resolve(server.plugins[name]);
                }
                else {
                    log.trace("Plugin %s is still not available. Waiting another 100ms", name);
                    timer = setTimeout(checkDeps, 100);
                }
            }

            if(server.plugins[name]) {
                log.trace("Plugin %s is already loaded, resolving it right now", name);
                resolve(server.plugins[name]);
            }
            else {
                log.trace("Plugin %s is not available. Waiting 100ms for it", name);
                timer = setTimeout(checkDeps, 100);
            }

        });

        promise.finally(function() {
            log.trace("Cleaning up plugin %s resolution timer", name);
            if(timer) {
                clearTimeout(timer);
            }
        });

        return promise.timeout(checkDepsTimeout);
    }
};
