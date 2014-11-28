var Buffer = require('buffer').Buffer;
var mime = require('mime');
var async = require('async');
var util = require('./lib/util');

var log;

module.exports = function(req, res, next, data) {
    log = data.log;

    var options = data.options;

    var routers = options.routers;
    var type = options.type || 'html';
    var charset = options.charset;
    var steps = [];

    res.set('content-type', mime.lookup(type) + '; charset=' + charset);

    routers.forEach(function(router) {
        router = makeStep.apply(null, router);
        steps.push(router);
    });

    async.parallel(steps, function(err, results) {
        if (err) {
            res.status(500).end();
            return;
        }
        
        results.forEach(function(result){
            if(typeof result == 'string'){
                result = new Buffer(result);
            }
            res.write(result);
        });
        res.end();
    });
};

function makeStep() {
    var args = [].slice.apply(arguments);
    var name = args.shift();
    return function(callback) {
        var runArgs = [callback];
        for (var i = 0, len = args.length; i < len; i++) {
            runArgs.push(args[i]);
        }
        if (typeof name === 'string') {
            var router = 'nep-router-' + name
            if (!util.lookup(router)) {
                log.error('router not found : ' + router);
                callback(1);
            }
            else {
                require(router).apply(null, runArgs);
            }
        }
        else if (typeof name === 'function') {
            name.apply(null, runArgs);
        }
    };
}