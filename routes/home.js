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
module.exports = function(server) {

    var cfg = server.plugins['hapi-config'].CurrentConfiguration;

    var ctx = cfg.get('server:info') || {
        app_title: "CMBF App",
        app_name: "cmbf_app"
    };

    ctx.admin_url = server.select('admin').info.uri + "/admin";

    return {
        method: 'GET',
        path: '/',
        handler: {
            view: {
                template: 'home',
                context: ctx
            }
        }
    }
};
