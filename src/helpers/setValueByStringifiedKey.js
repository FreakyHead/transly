function setValueByStringifiedKey(key, newValue, object = {}) {
  const keys = key.split(";") || [];
  let value = object;
  keys.forEach((k, i) => {
    if (i === keys.length - 1) {
      value[k] = newValue;
      return;
    }
    value = value?.[k];
  });
}

module.exports = {
  setValueByStringifiedKey,
};
