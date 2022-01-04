function findPosition(data = [], language, key, path) {
  const languagePos = data[0].indexOf(language);
  const keyPos = keyPosition(data, 1, key, path);
  return [keyPos, languagePos];
}

function keyPosition(data, startIndex, key, path) {
  for (let i = 0; i <= data.length; i += 1) {
    if (data[i]?.[startIndex] === undefined) {
      continue;
    }
    if (data[i]?.[startIndex] === key && data[i][0] === path) {
      return i;
    }
  }
  return -1;
}

module.exports = {
  findPosition,
};
