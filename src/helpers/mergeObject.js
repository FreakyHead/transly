const mergeObject = (object = {}, keys, value) => {
  keys.split(";").reduce((acc, key, i, keys) => {
    if (i === keys.length - 1) {
      acc[key] = value;
      return;
    }
    if (!acc[key]) {
      acc[key] = {};
    }
    acc = acc[key];
    return acc;
  }, object);
  return object;
};

module.exports = {
  mergeObject,
};
