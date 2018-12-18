'use strict';

const fs = require('fs');
const dot = require('dot-object');

function fetchFile(file) {
    return new Promise((resolve) => {
        fs.readFile(file, (error, data) => {
            resolve({
                language: file.split('/')[0],
                fileName: file.split('/')[1].substring(0, file.split('/')[1].length - 5),
                name: file,
                data: JSON.parse(data),
                changed: false,
            });
        });
    });
}

function isFile(path) {
    return fs.lstatSync(path).isFile();
}

async function getFiles(matches) {
    return await Promise.all(matches.filter(isFile).map(async fileName => {
        return await fetchFile(fileName);
    }));
}

function prepareTranslations(filesData) {
    const translations = {};
    filesData.forEach((tFile) => {
        tFile.dotData = dot.dot(tFile.data);
        translations[tFile.name] = tFile;
    });
    return translations;
}

function mergeTranslations(tData) {
    const mergedTranslations = {};
    Object.keys(tData).map((filePath) => {
        const fileName = tData[filePath].fileName;
        mergedTranslations[fileName] = Object.assign(mergedTranslations[fileName] || {}, tData[filePath].dotData);
    });
    const translations = {};


    Object.keys(tData).map((filePath) => {
        const file = tData[filePath];

        Object.keys(mergedTranslations[file.fileName]).map((key) => {
            const merged = mergedTranslations[file.fileName][key];
            if (!file.dotData[key]) {
                file.dotData[key] = 'NO_TRANSLATION: ' + key;
                file.changed = true;
            }
        });

        if (file.changed) {
            file.data = dot.object({...file.dotData});
        }

        translations[filePath] = file;
    });

    return translations;
}

async function saveTranslations(translations) {
    let changedFiles = 0;

    Object.keys(translations).map((key) => {
        let file = translations[key];
        if (file.changed) {
            changedFiles += 1;
            fs.writeFile(file.name, JSON.stringify(file.data), (err) => {
                if (err) {
                    console.log('error saving ' + file.name);
                } else {
                    console.log('saved file ' + file.name);
                }
            });
        }

    });

    console.log(`${changedFiles} files saved`.red);
}

async function mergeFiles(filesNames) {
    const filesData = await getFiles(filesNames);

    let translations = prepareTranslations(filesData);
    translations = mergeTranslations(translations);
    saveTranslations(translations);
}

// const flatData = dot.dot(file.data);

module.exports = {
    mergeFiles,
};
