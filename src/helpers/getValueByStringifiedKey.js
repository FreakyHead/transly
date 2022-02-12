function getValueByStringifiedKey(key, object = {}) {
  let value = object;
  const keys = key.split(";") || [];
  keys.forEach((k) => {
    value = value?.[k];
  });
  return value;
}

module.exports = {
  getValueByStringifiedKey,
};
