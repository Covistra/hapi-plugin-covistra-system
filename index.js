/**

 Copyright 2015 Covistra Technologies Inc.

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
"use strict";
var Handlebars = require('handlebars');
var bunyan = require('bunyan');
var bformat = require('bunyan-format');
var formatOut = bformat({ outputMode: 'short' });
var _ = require('lodash');
var P = require('bluebird');

exports.register = function (plugin, options, next) {
    plugin.log(['plugin', 'info'], "Registering the System plugin");

    var config = plugin.plugins['hapi-config'].CurrentConfiguration;
    var systemLog = bunyan.createLogger(config.get('plugins:system:root_log', { name:'cmbf-system', stream: formatOut }));
    var Router = require('./lib/route-loader')(plugin, systemLog, config);

    // Register model
    var SystemStatus = require('./model/system_status')(plugin, systemLog, config);

    plugin.expose('SystemStatus', SystemStatus);
    plugin.expose('clock', require('./lib/clock'));
    plugin.expose('systemLog', systemLog);
    plugin.expose('RestUtils', require('./lib/rest_utils'));
    plugin.expose('Report', require('./lib/report'));
    plugin.expose('TemplateEngine', require('./lib/template-engine'));
    plugin.expose('Router', Router);
    plugin.expose('resolveDeps', require('./lib/resolve_deps')(plugin, systemLog, config));
    plugin.expose('random', require('./lib/id-generator')(plugin, systemLog, config));

    // Register routes
    Router.routes(plugin, __dirname, './routes');

    plugin.views({
        engines: {
            html: Handlebars
        },
        relativeTo: __dirname,
        layout: true,
        path: "./views",
        partialsPath: './views/partials',
        layoutPath: "./views/layouts"
    });

    var cfg = config.get('plugins:system:seneca');

    var Services = require('./lib/discover-service')(plugin, config, systemLog);

    plugin.expose('Services', Services);

    function _promisifyEntity(entity) {
        if(entity) {
            entity.list$ = P.promisify(entity.list$, {context: entity});
            entity.save$ = P.promisify(entity.save$, {context: entity});
            entity._load$ = P.promisify(entity.load$, {context: entity});
            entity.load$ = function() {
                return this._load$.apply(this, arguments).then(_promisifyEntity);
            };
            entity.remove$ = P.promisify(entity.remove$, {context: entity});
            entity.native$ = P.promisify(entity.native$, { context: entity});
        }
        return entity;
    }

    // Register a few promisify methods
    plugin.seneca.actAsync = P.promisify(plugin.seneca.act, {context:plugin.seneca});
    plugin.seneca.makeAsync$ = function() {
        return _promisifyEntity(this.make$.apply(this, arguments));
    };

    // Abstract the use of Seneca
    plugin.expose('service', plugin.seneca.actAsync.bind(plugin.seneca));

    return P.each(_.keys(cfg.plugins), function(pluginKey) {
        systemLog.debug("Installing Seneca plugin", pluginKey);
        plugin.seneca.use(pluginKey, cfg.plugins[pluginKey]);
    }).then(function() {
        return Services.discover(__dirname, "services");
    }).finally(next);
};

exports.register.attributes = {
    pkg: require('./package.json')
};
