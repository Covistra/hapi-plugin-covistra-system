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
    Joi = require('joi'),
    Path = require('path');

module.exports = function(server, config, log) {

    function DiscoverService() {
        this.services = [];
    }

    function _registerProtocolHandler(service) {
        if(service.event) {
            var socketManager = server.plugins['covistra-socket'].socketManager;
            log.debug("Registering global handler: ", service.event);
            socketManager.registerGlobalHandler(service.event, (function(h) {
                return function(msg) {
                    var m = _.extend(h.pattern, msg.data, { socket$: _.omit(msg, 'data') });
                    server.seneca.act(m, function(err, result) {
                        if(err) {
                            log.error("Error while processing message %s.", service.pattern, err);
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
            })(service));
        }
    }

    function _registerRoute(service) {
        if(service.route) {
            service.route.handler = function(req, reply) {
                var msg = _.extend(service.pattern, req.payload, req.params, req.query);
                msg.credentials = _.get(req.auth, "credentials");
                return server.cmbf.service(msg).then(function(result) {

                    if(result && result.$redirect) {
                        return reply().redirect(result.$redirect);
                    }

                    reply(result);
                });
            };
            server.route(service.route);
        }
    }

    var _validateMessage = P.method(function(service, msg) {
        if(service.schema) {
            return P.promisify(Joi.validate, {context:Joi})(msg, service.schema, { allowUnknown: service.allowUnknown || true, stripUnknown: service.stripUnknown || true });
        }
        else {
            return msg;
        }
    });

    DiscoverService.prototype.discover = function(path) {
        var _this = this;

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

                // Keep track of all our services for documentation purpose
                _this.services.push(service);

                // register any global event handler
                _registerProtocolHandler(service);

                // Register Routes
                _registerRoute(service);

                // Register this service with seneca
                return server.seneca.add(service.pattern, function(msg, done) {
                    return _validateMessage(service, msg).then(function(msg) {
                        return P.method(service.callback)(msg).then(function(resp) {
                            // Apply any responseSchema before
                            if(service.responseSchema) {
                                return P.promisify(Joi.validate, {context: Joi})(resp, service.responseSchema, { allowUnknown: service.allowUnknown || true, stripUnknown: service.stripUnknown || true }).catch(function(err){
                                    log.warn("Validation Error:", err);
                                    log.warn("Context is", service);
                                    throw err;
                                });
                            }
                            else {
                                return resp;
                            }
                        }).asCallback(done);
                    }).catch(function(err) {
                        done(err);
                    });
                });
            },
            include: /service\.js$/
        });

    };

    return new DiscoverService();
};