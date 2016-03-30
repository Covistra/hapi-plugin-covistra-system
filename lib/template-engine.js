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
    _ = require('lodash');

var templates = {};

module.exports = {
    registerTemplate: P.method(function(id, tmpl, extra, options) {
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

        if(!templates[id]) {
            templates[id] = [];
        }

        // We may record multiple templates with the same id (override)
        templates[id].push({
            priority: options.priority || 5,
            source: options.source,
            extra: extra || {},
            fn: Hbs.compile(tmpl)
        });

        return templates[id];
    }),
    getTemplate: function(id, options) {
        options = options || {};

        var tmpls = templates[id] || [];

        if(options.source) {
            tmpls = _.filter(tmpls, function(t){return t.source === options.source});
        }

        var sortedTmpls = _.sortBy(tmpls, "priority").reverse();
        if(sortedTmpls.length > 0) {
            return sortedTmpls[0];
        }

    },
    renderTemplate: function(id, data, options) {
        var _this = this;
        options = options || {};
        if(options.sync) {
            var tmpl = this.getTemplate(id);
            if(tmpl) {
                return tmpl.fn(data);
            }
        }
        else {
            return new P(function(resolve) {
                var tmpl = _this.getTemplate(id);
                if(tmpl) {
                    resolve(tmpl.fn(data));
                }
                else {
                    resolve();
                }
            });
        }
    }
};
