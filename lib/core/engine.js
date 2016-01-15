'use strict';

let Promise = require('bluebird'),
  urlParser = require('url'),
  log = require('intel'),
  path = require('path'),
  merge = require('lodash.merge'),
  BmpRunner = require('./bmp_runner'),
  harBuilder = require('../support/har_builder'),
  trafficShapeParser = require('../support/traffic_shape_parser'),
  SeleniumRunner = require('./selenium_runner');

const defaults = {
  'scripts': [],
  'iterations': 3,
  'delay': 0
};

class Engine {
  constructor(options) {
    this.options = merge({}, defaults, options);
    this.bmpRunner = new BmpRunner();
  }

  start() {
    return this.bmpRunner.start();
  }

  run(url) {
    let options = this.options;
    let preTask = options.preTask,
      postTask = options.postTask;
    let scripts = options.scripts;
    let pageCompleteCheck = options.pageCompleteCheck;
    let delay = options.delay;
    let bmpRunner = this.bmpRunner;

    function runScripts(runner) {
      return Promise.reduce(scripts, function(results, script) {
        let name = path.basename(script.path, '.js');
        // Scripts should be valid statements such as 'document.title;') or IIFEs '(function() {...})()' that can run
        // on their own in the browser console. Prepend with 'return' to return result of statement to Browsertime.
        let source = 'return ' + script.source;
        let result = runner.runScript(source);

        return Promise.join(name, result, function(n, r) {
          results[n] = r;
          return results;
        });
      }, {});
    }

    function runIteration() {
      let runner = new SeleniumRunner(options);

      return runner.start()
        .tap(function(capabilities) {
          log.verbose('Capabilities %:1j', capabilities.serialize());
        })
        .tap((capabilities) => {
          if (preTask) {
            return preTask.run({
              capabilities,
              'runWithDriver': function(driverScript) {
                return runner.runWithDriver(driverScript);
              }
            });
          }
        })
        .tap(() => runner.loadAndWait(url, pageCompleteCheck))
        .then(() => runScripts(runner))
        .tap((results) => {
          if (postTask) {
            postTask.run(results);
          }
        })
        .finally(() => runner.stop());
    }

    function shouldDelay(runIndex, totalRuns) {
      let moreRunsWillFollow = ((totalRuns - runIndex) > 1);
      return (delay > 0) && moreRunsWillFollow;
    }

    let iterations = new Array(this.options.iterations);

    let result = {};
    return bmpRunner.startProxy()
      .tap(function(proxyPort) {
        options.proxyPort = proxyPort;
      })
      .tap(() => {
        let proxyConfigTasks = [];
        let trafficShapeConfig = trafficShapeParser.parseTrafficShapeConfig(options);
        if (trafficShapeConfig) {
          proxyConfigTasks.push(bmpRunner.setLimit(trafficShapeConfig));
        }
        const auth = options.basicAuth;
        if (auth) {
          if (!auth.domain) {
            auth.domain = urlParser.parse(url).host;
            log.verbose('Extracting domain %s for basic authentication from url', auth.domain);
          }
          proxyConfigTasks.push(bmpRunner.addBasicAuth(auth.domain, auth.username, auth.password));
        }
        return Promise.all(proxyConfigTasks);
      })
      .then(() => bmpRunner.createHAR())
      .then(() => Promise.reduce(iterations, function(results, item, runIndex, totalRuns) {
          let promise = Promise.resolve();

          if (runIndex > 0) {
            promise = promise.then(() => bmpRunner.startNewPage());
          }

          promise = promise
            .then(runIteration)
            .then(function(r) {
              results.push(r);
              return results;
            });

          if (shouldDelay(runIndex, totalRuns)) {
            promise = promise.delay(delay);
          }

          return promise;
        }, [])
      )
      .tap(function(data) {
        result.browsertimeData = data;
      })
      .then(() => bmpRunner.getHAR())
      .then(JSON.parse)
      .tap(function(har) {
        harBuilder.addCreator(har);
        result.har = har;
      })
      .tap(() => bmpRunner.stopProxy())
      .then(() => result);
  }

  stop() {
    log.debug('Stopping proxy process');
    return this.bmpRunner.stop()
      .tap(function() {
        log.debug('Stopped proxy process');
      });
  }
}

module.exports = Engine;
