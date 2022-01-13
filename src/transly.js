#!/usr/bin/env node

const { createFileList } = require("./services/filesystem");
const path = require("path");
const fs = require("fs");
const { flatObject } = require("./services/flatObject");
const { findPosition } = require("./helpers/findPosition");
const { mergeObject } = require("./helpers/mergeObject");
const xlsx = require("node-xlsx");
const fse = require("fs-extra");

function createXLSX() {
  const files = createFileList(
    `${path.resolve(__dirname, "../translations/JSON")}`
  );

  const data = [["PATH", "KEY"]];

  files.forEach((file, index) => {
    const paths = file
      .split("JSON")[1]
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
    path.resolve(__dirname, "../translations/XLSX", "translations.xlsx"),
    xlsx.build([{ name: "translations", data }])
  );
}

function createJSONs() {
  const workSheetsFromFile = xlsx.parse(
    path.resolve(__dirname, "../translations/XLSX", "translations.xlsx")
  );
  console.log(workSheetsFromFile[0].data);

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
    const dirname = path.resolve(__dirname, "../");
    console.log(dirname);
    fse.outputFile(
      `${dirname}/translations/JSONs/${k}.json`,
      JSON.stringify(v, null, 2)
    );
  });
}

if (process.argv[2] === "--parse") {
  createXLSX();
}

if (process.argv[2] === "--generate") {
  createJSONs();
}
