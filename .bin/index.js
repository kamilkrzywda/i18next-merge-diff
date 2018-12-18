#!/usr/bin/env node

'use strict';

require('colors');

const glob = require('glob-promise');
const i18nextMerger = require('../src/index');

const options = {
    nodir: true,
    dot: true,
};

glob('*/*.json', options)
    .then((files) => {
        console.log(`Found ${files.length} translation files`.gray);
        i18nextMerger.mergeFiles(files);
    })
    .catch((err) => {
        console.error(err.message.red);
    });