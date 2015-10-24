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
var P = require('bluebird'),
    path = require('path'),
    _ = require('lodash');

module.exports = function(server, log, config) {

    function SystemStatus() {
        this.subsystems = {};
    }

    SystemStatus.prototype.setSubSystemStatus = function(subsystemKey, status) {
        if(!this.subsystems[subsystemKey]) {
            this.subsystems[subsystemKey] = {};
        }
        else {
            this.subsystems[subsystemKey].status = status;
            this.subsystems[subsystemKey].ts = new Date();
        }

    };

    SystemStatus.prototype.reportSystemStatus = P.method(function() {
        var pkg = require(path.resolve(process.cwd(), "package.json"));

        return {
            subsystems: thissubsystems,
            version: pkg.version
        };
    });

    return new SystemStatus();
};

