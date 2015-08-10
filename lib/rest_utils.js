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
var jsep = require('jsep'),
    url = require('url'),
    P = require('bluebird'),
    trim = require('trim'),
    _ = require('lodash');

function truncateDecimals (num, digits) {
    var numS = num.toString(),
        decPos = numS.indexOf('.'),
        substrLength = decPos === -1 ? numS.length : 1 + decPos + digits,
        trimmedResult = numS.substr(0, substrLength),
        finalResult = isNaN(trimmedResult) ? 0 : trimmedResult;

    return parseFloat(finalResult);
}

function applyBinaryExpression(expr) {
    return new P(function(resolve){
        var query = {};

        switch(expr.operator) {
            case '==':
                query[expr.left.name] = expr.right.value || expr.right.name;
                break;
            case '>=':
                query[expr.left.name] = {
                    $gte: expr.right.value || expr.right.name
                };
                break;
            case '<=':
                query[expr.left.name] = {
                    $lte: expr.right.value || expr.right.name
                };
                break;
            case '>':
                query[expr.left.name] = {
                    $gt: expr.right.value || expr.right.name
                };
                break;
            case '<':
                query[expr.left.name] = {
                    $lt: expr.right.value || expr.right.name
                };
                break;
            case '!=':
                query[expr.left.name] = {
                    $ne: expr.right.value || expr.right.name
                };
                break;
            default:
                console.log("invalid operator:", expr.operator);
                break;
        }

        resolve(query);
    });
}

function applyFilterExpression(expr) {
    return new P(function(resolve) {
        var query = {};
        switch(expr.type) {
            case 'Compound':
                query = P.each(expr.body, applyFilterExpression);
                break;
            case 'BinaryExpression':
                query =  applyBinaryExpression(expr);
                break;
            case 'UnaryExpression':
                break;
            case 'LogicalExpression':
                break;
            case 'Identifier':
                query[expr.name] = true;
                break;
            default:
                throw new Error("invalid expression type: "+expr.type);
        }
        resolve(query);
    });
}


function buildPageUrl(spec, request, targetPage, currentPage) {
    if(targetPage < 0 || targetPage > spec.totalPageCount) {
        return undefined;
    }

    var urlObj = url.parse(spec.baseUrl + request.url, true);
    urlObj.query.skip = targetPage * spec.size;
    urlObj.query.size = spec.size;
    urlObj.search = "";
    urlObj.href = "";

    return {
        url: url.format(urlObj),
        size: spec.size,
        skip: targetPage * spec.size,
        pageNumber: targetPage,
        pageNumberDisplay: targetPage + 1,
        active: targetPage === currentPage
    }
}

module.exports = {
    buildFilter: function(specs) {
        specs = specs || "";

        return P.map(specs.split(','), function(s) {
            var exprString = trim(s);
            var expr = jsep(exprString);
            return applyFilterExpression(expr);
        }).then(function(filters) {
            return _.merge.apply(this, filters);
        });

    },
    buildSortSpec: function(spec) {
        var sort = {};
        var sorts = spec;
        if(!_.isArray(spec)) {
            sorts = spec.split(',');
        }

        _.each(sorts, function(s) {
            if(s.indexOf('-') === 0) {
                sort[s.substring(1)] = -1;
            }
            else {
                sort[s] = 1;
            }
        });

        console.log("Sort spec:", sort);
        return sort;
    },
    /**
     *
     * @param spec { data, totalCount, offset, size }
     */
    paginate: function(spec, request, resp) {
        spec.baseUrl = nconf.get('app:base_url');
        var totalPageCount = truncateDecimals(spec.totalCount / spec.size, 0);

        if(spec.totalCount % spec.size > 0) {
            console.log("Additional Elements", spec.totalCount % spec.size );
            spec.totalPageCount = totalPageCount+1;
        }
        else {
            spec.totalPageCount = totalPageCount;
        }
        if(spec.totalCount !== 0) {
            spec.requestPageNumber = Number(Number(spec.offset / spec.totalCount).toFixed(0));
        }
        else {
            spec.requestPageNumber = 0;
        }

        // Build all pages URLs
        var pageUrls = [];
        if(spec.links) {
            for(var i=0; i<spec.totalPageCount; i++) {
                pageUrls.push(buildPageUrl(spec, request, i, spec.requestPageNumber));
            }
        }

        if(spec.use_headers) {

            resp.header('X-Pagination-Per-Page', spec.size);
            resp.header('X-Pagination-Current-Page', spec.requestPageNumber);
            resp.header('X-Pagination-Total-Pages', spec.totalPageCount);
            resp.header('X-Pagination-Total-Entries', spec.totalCount);

            return spec.data;
        }
        else {
            return {
                "data" : spec.data,
                "_pagination": {
                    totalCount: spec.totalCount,
                    requestCount: spec.size,
                    requestOffset: spec.offset,
                    requestPageNumber: spec.requestPageNumber,
                    requestPageNumberDisplay: spec.requestPageNumber+1,
                    totalPageCount: spec.totalPageCount,
                    previousUrl: buildPageUrl(spec, request, spec.requestPageNumber-1),
                    nextUrl: buildPageUrl(spec, request, spec.requestPageNumber+1),
                    firstUrl: buildPageUrl(spec, request, 0),
                    lastUrl: buildPageUrl(spec, request, spec.totalPageCount-1),
                    pages: pageUrls
                }
            };
        }

    }
};
