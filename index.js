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

exports.register = function (plugin, options, next) {
    plugin.log(['plugin', 'info'], "Registering the System plugin");

    var config = plugin.plugins['hapi-config'].CurrentConfiguration;
    var Router = require('./lib/route-loader')(plugin);
    var systemLog = bunyan.createLogger(_.defaults(config.get('plugins:system:root_log') || {}, { name:'cmbf-system', stream: formatOut }));

	// Register model
    var SystemStatus = require('./model/system_status')(plugin, systemLog, config);

    plugin.expose('SystemStatus', SystemStatus);
    plugin.expose('clock', require('./lib/clock'));
    plugin.expose('systemLog', systemLog);
    plugin.expose('RestUtils', require('./lib/rest_utils'));
    plugin.expose('Report', require('./lib/report'));
    plugin.expose('TemplateEngine', require('./lib/template-engine'));
    plugin.expose('Router', Router);

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

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};
