const fs = require("fs");
const path = require("path");

function createFileList(root, fileList = []) {
  const listOfFiles = fileList;
  let files = fs.readdirSync(root);

  files.forEach((el) => {
    if (fs.statSync(path.resolve(root, el)).isDirectory()) {
      files = createFileList(path.resolve(root, el), listOfFiles);
    } else {
      listOfFiles.push(path.resolve(root, el));
    }
  });

  return fileList;
}

module.exports = {
  createFileList,
};
