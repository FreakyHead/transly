#!/usr/bin/env node

const { createFileList } = require("./services/filesystem");
const path = require("path");
const fs = require("fs");
const { flatObject } = require("./services/flatObject");
const { findPosition } = require("./helpers/findPosition");
const {
  getValueByStringifiedKey,
} = require("./helpers/getValueByStringifiedKey");
const {
  setValueByStringifiedKey,
} = require("./helpers/setValueByStringifiedKey");
const { mergeObject } = require("./helpers/mergeObject");
const xlsx = require("node-xlsx");
const fse = require("fs-extra");
const yargs = require("yargs");
const logger = require("./helpers/logger");

const JSON_EXTENSION = ".json";

function addNormalizedValue(inputJSON, key, translation, filePath) {
  const normalizedValue = getValueByStringifiedKey(key, inputJSON);

  if (normalizedValue) {
    setValueByStringifiedKey(key, translation, inputJSON);
  } else if (inputJSON) {
    logger.warn(`Key '${key}' doesn't exist in initial JSON ${filePath}`);
  }
}

function createXLSX(translationPath, outputPath) {
  const files = createFileList(`${path.resolve(translationPath)}`).filter(
    (file) => file.includes(JSON_EXTENSION)
  );

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, {
      recursive: true,
    });
  }

  const data = [["PATH", "KEY"]];

  files.forEach((file) => {
    const paths = file
      .split(translationPath.substring(1))[1]
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

function createJSONs(translationPath, outputPath, input, outputNormalized) {
  const workSheetsFromFile = xlsx.parse(
    path.resolve(translationPath, "translations.xlsx")
  );

  const [headers, ...data] = workSheetsFromFile[0].data;

  const [, , ...languages] = headers;

  const files = new Map();

  const inputJSONs = new Map();

  if (outputNormalized) {
    const inputJSONFiles = createFileList(`${path.resolve(input)}`).filter(
      (file) => file.includes(JSON_EXTENSION)
    );

    inputJSONFiles.forEach((file) => {
      const paths = file
        .split(input.substring(1))[1]
        .split(path.sep)
        .filter((x) => x !== "");
      const content = JSON.parse(fs.readFileSync(file, "utf-8"));
      inputJSONs.set(paths.join("/"), content);
    });

    if (!fs.existsSync(outputNormalized)) {
      fs.mkdirSync(outputNormalized, {
        recursive: true,
      });
    }
  }
  data.forEach((el) => {
    const [path, key, ...translations] = el;

    translations.forEach((translation, index) => {
      const filePath = `${path ? `${path}/` : ""}${
        languages[index]
      }${JSON_EXTENSION}`;
      const elements = files.get(filePath) || {};
      files.set(filePath, mergeObject(elements, key, translation));
      if (outputNormalized) {
        addNormalizedValue(
          inputJSONs.get(filePath),
          key,
          translation,
          filePath
        );
      }
    });
  });

  files.forEach((v, k) => {
    const dirname = path.resolve(outputPath);
    fse.outputFileSync(`${dirname}/${k}`, JSON.stringify(v, null, 2));
  });
  if (outputNormalized) {
    inputJSONs.forEach((v, k) => {
      const dirname = path.resolve(outputNormalized);
      fse.outputFileSync(`${dirname}/${k}`, JSON.stringify(v, null, 2));
    });
  }
}

const parse = {
  command: "parse",
  desc: "parse JSON files and generate the translation file",
  builder: (args) =>
    args
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
      logger.error(error);
    }
  },
};

const generate = {
  command: "generate",
  desc: "parse XLSX file and generate translations for each locale",
  builder: (args) =>
    args
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
        default: "./translations/JSON-output",
      })
      .option("output-normalized", {
        desc: "path to output normalized",
        type: "string",
        alias: "n",
      })
      .option("input", {
        desc: "path to input JSON",
        type: "string",
        alias: "i",
        default: "./translations/JSON",
      }),
  handler: (arv) => {
    try {
      createJSONs(
        arv.translations,
        arv.output,
        arv.input,
        arv.outputNormalized
      );
    } catch (error) {
      logger.error(error);
    }
  },
};

yargs.command(parse).command(generate).help().argv;
