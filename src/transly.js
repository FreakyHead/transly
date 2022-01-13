#!/usr/bin/env node

const { createFileList } = require("./services/filesystem");
const path = require("path");
const fs = require("fs");
const { flatObject } = require("./services/flatObject");
const { findPosition } = require("./helpers/findPosition");
const { mergeObject } = require("./helpers/mergeObject");
const xlsx = require("node-xlsx");
const fse = require("fs-extra");
const yargs = require("yargs");

function createXLSX(translationPath, outputPath) {
  const files = createFileList(`${path.resolve(translationPath)}`).filter(
    (file) => file.includes(".json")
  );

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, {
      recursive: true,
    });
  }

  const data = [["PATH", "KEY"]];

  files.forEach((file, index) => {
    const paths = file
      .split(translationPath)[1]
      .split(path.sep)
      .filter((x) => x !== "");
    const filePath =
      paths.length > 1 ? paths.slice(0, paths.length - 1).join("/") : "";
    const language = paths[paths.length - 1].split(".")[0];

    const content = flatObject(JSON.parse(fs.readFileSync(file, "utf-8")));

    const [, , ...languages] = data[0];
    const indexOfLanguage = languages.indexOf(language);

    if (indexOfLanguage === -1) {
      data[0].push(language);
    }

    Object.entries(content).map(([k, v]) => {
      const [x, y] = findPosition(data, language, k, filePath);
      if (x === -1) {
        data.push(new Array(data[0].length));
      }
      const X = x === -1 ? data.length - 1 : x;
      data[X][0] = filePath;
      data[X][1] = k;
      data[X][y] = v;
    });
  });

  fs.writeFileSync(
    path.resolve(outputPath, "translations.xlsx"),
    xlsx.build([{ name: "translations", data }])
  );
}

function createJSONs(translationPath, outputPath) {
  const workSheetsFromFile = xlsx.parse(
    path.resolve(translationPath, "translations.xlsx")
  );

  const [headers, ...data] = workSheetsFromFile[0].data;

  const [, , ...languages] = headers;

  const files = new Map();

  data.forEach((el) => {
    const [path, key, ...translations] = el;

    translations.forEach((translation, index) => {
      const elements = files.get(`${path}/${languages[index]}`) || {};
      files.set(
        `${path}/${languages[index]}`,
        mergeObject(elements, key, translation)
      );
    });
  });

  files.forEach((v, k) => {
    const dirname = path.resolve(outputPath);
    fse.outputFile(`${dirname}/${k}.json`, JSON.stringify(v, null, 2));
  });
}

const parse = {
  command: "parse",
  desc: "parse JSON files and generate the translation file",
  builder: (yargs) =>
    yargs
      .option("translations", {
        desc: "path to translation files",
        type: "string",
        alias: "t",
        default: "./translations/JSON",
      })
      .option("output", {
        desc: "path to output",
        type: "string",
        alias: "o",
        default: "./translations/XLSX",
      }),
  handler: (arv) => {
    try {
      createXLSX(arv.translations, arv.output);
    } catch (error) {
      console.error(error);
    }
  },
};

const generate = {
  command: "generate",
  desc: "parse XLSX file and generate translations for each locale",
  builder: (yargs) =>
    yargs
      .option("translations", {
        desc: "path to translation files",
        type: "string",
        alias: "t",
        default: "./translations/XLSX",
      })
      .option("output", {
        desc: "path to output",
        type: "string",
        alias: "o",
        default: "./translations/JSON",
      }),
  handler: (arv) => {
    try {
      createJSONs(arv.translations, arv.output);
    } catch (error) {
      console.error(error);
    }
  },
};

yargs.command(parse).command(generate).help().argv;
