/**
 Copyright 2015-2016 Covistra Technologies Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

var requireDirectory = require('require-directory'),
    _ = require('lodash'),
    P = require('bluebird'),
    Path = require('path');

module.exports = function(server, config, log) {

    function DiscoverService() {}

    DiscoverService.prototype.discover = function(path) {

        if(arguments.length > 1) {
            path = Array.prototype.slice.call(arguments).join("/");
        }
        else if(_.isArray(path)) {
            path = path.join("/");
        }

        log.debug("Registering all micro-services located in path:", Path.resolve(path));

        var services = requireDirectory(module, Path.resolve(path), {
            visit: function(factory, filename) {
                log.trace("Loading micro-service", filename);
                var service = factory(server, config, log);
                log.debug("Registering micro-service:", service.pattern);
                return server.seneca.add(service.pattern, function(msg, done) {
                    return P.method(service.callback)(msg).asCallback(done);
                });
            },
            include: /service\.js$/
        });

    };

    DiscoverService.prototype.registerProtocolHandlers = P.method(function(protocolHandlers, socketManager) {
        log.debug("DiscoveryService:registerProtocolHandlers");

        if(!socketManager && server.plugins['covistra-socket']) {
            socketManager = server.plugins['covistra-socket'].socketManager;
        }

        if(!socketManager) {
            log.warn("Please load the covistra-socket plugin to use protocol handlers. No handle will be registered");
            return;
        }

        return P.each(protocolHandlers, function(handler) {
            log.debug("Registering global handler: ", handler.key);
            socketManager.registerGlobalHandler(handler.key, (function(h) {
                return function(msg) {
                    var m = _.extend(h.pattern, msg.data, { socket$: _.omit(msg, 'data') });
                    server.seneca.act(m, function(err, result) {
                        if(err) {
                            log.error("Error while processing message %s.", handler.pattern, err);
                            if(msg.ack) {
                                log.trace("Sending back error to socket client %s", msg.context.client.id);
                                msg.ack(err);
                            }
                        }
                        else {
                            log.trace("Received service result: ", result);
                            if(msg.ack) {
                                log.trace("Sending back result to socket client %s", msg.context.client.id);
                                msg.ack(result);
                            }
                        }
                    });
                }
            })(handler));
        });

    });

    return new DiscoverService();
};