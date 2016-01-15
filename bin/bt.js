#!/usr/bin/env node

'use strict';

let Engine = require('../').Engine,
  browserScripts = require('../lib/support/browser_script'),
  logging = require('../').logging,
  cli = require('../lib/support/cli'),
  fileNamer = require('../lib/support/file-namer').fileNamer,
  Promise = require('bluebird'),
  fs = require('fs'),
  log = require('intel');

Promise.promisifyAll(fs);

function run(url, options) {
  options.scripts = browserScripts.defaultScripts;

  let engine = new Engine(options);

  log.info('Running %s for url: %s', options.browser, url);
  if (log.isEnabledFor(log.VERBOSE)) {
    log.verbose('Running with options: %:2j', options);
  }

  engine.start()
    .then(function() {
      return engine.run(url);
    })
    .then(function(result) {
      const namer = fileNamer();

      let jsonName = options.output || namer.getNameFromUrl(url, 'json');
      let browsertimeData = JSON.stringify(result.browsertimeData, null, 2);

      const fileWriteOperations = [
        fs.writeFileAsync(jsonName, browsertimeData).tap(() => {
          log.info('Wrote browsertime data to %s', jsonName);
        })
      ];

      if (result.har) {
        let har = JSON.stringify(result.har, null, 2);
        let harName = options.har || namer.getNameFromUrl(url, 'har');

        fileWriteOperations.push(fs.writeFileAsync(harName, har).tap(() => {
            log.info('Wrote har data to %s', harName);
          })
        );
      }

      if (result.ffHar) {
        let har = JSON.stringify(result.ffHar, null, 2);

        fileWriteOperations.push(fs.writeFileAsync('ff.har', har).tap(() => {
            log.info('Wrote Firefox har data to %s', 'ff.har');
          })
        );
      }

      return Promise.all(fileWriteOperations);
    })
    .catch(function(e) {
      log.error('Error running browsertime', e);
      throw e;
    })
    .finally(function() {
      log.verbose('Stopping Browsertime');
      return engine.stop()
        .tap(() => {
          log.debug('Stopped Browsertime');
        })
        .catch((e) => {
          log.error('Error stopping Browsertime!', e);

          process.exitCode = 1;
        });
    })
    .catch(function() {
      process.exitCode = 1;
    })
    .finally(process.exit); // explicitly exit to avoid a hanging process
}

let cliResult = cli.parseCommandLine();

logging.configure(cliResult.options);

if (log.isEnabledFor(log.CRITICAL)) { // TODO change the threshold to VERBOSE before releasing 1.0
  Promise.longStackTraces();
}

run(cliResult.url, cliResult.options);
