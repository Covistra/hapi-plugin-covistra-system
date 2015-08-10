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
var Hbs = require('handlebars'),
    P = require('bluebird'),
    fs = require('fs'),
    path = require('path'),
    _ = require('lodash');

var templates = {};

// Register generic partials and helpers

Hbs.registerPartial('email_header', fs.readFileSync(path.resolve(__dirname, "..", "templates", "mail_header.hbs"), "utf8"));
Hbs.registerPartial('email_footer', fs.readFileSync(path.resolve(__dirname, "..", "templates", "mail_footer.hbs"), "utf8"));

module.exports = {
    registerTemplate: function(id, tmpl, options) {
        return new P(function(resolve, reject){
            options = options || {};

            if(options.partials) {
                _.each(_.keys(options.partials), function(id) {
                    Hbs.registerPartial(id, options.partials[id]);
                });
            }

            if(options.helpers) {
                _.each(_.keys(options.helpers), function(id) {
                    Hbs.registerHelper(id, options.helpers[id]);
                });
            }

            try {
                templates[id] = Hbs.compile(tmpl);
                resolve(templates[id]);
            }
            catch(err) {
                reject(err);
            }
        });
    },
    renderTemplate: function(id, data, options) {
        options = options || {};
        if(options.sync) {
            var tmpl = templates[id];
            if(tmpl) {
                return tmpl(data);
            }
        }
        else {
            return new P(function(resolve, reject) {
                var tmpl = templates[id];
                if(tmpl) {
                    try {
                        resolve(tmpl(data));
                    }
                    catch(err) {
                        reject(err);
                    }
                }
            });
        }
    }
};
