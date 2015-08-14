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

var requireDirectory = require('require-directory');
var _ = require('lodash');
var path = require('path');

module.exports = function(server, log, config) {
    return {
        routes: function(plugin) {
            var args = Array.prototype.slice.call(arguments);
            args.shift();
            var folder = path.resolve.apply(path, args);
            plugin.log(['info'], "Loading all routes from "+folder);
            plugin.route(_.values(requireDirectory(module, folder, {exclude: /index\.js/, visit: function(cstor, path, filename) {
                plugin.log(['plugin','route','debug'], "Registering route "+filename);
                return cstor(plugin, log.child({route: filename }), config);
            }})));
        }
    }
};
