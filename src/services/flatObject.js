function flatObject(object) {
  const toReturn = {};

  for (const i in object) {
    if (!object.hasOwnProperty(i)) continue;

    if (typeof object[i] == "object") {
      const flatObject1 = flatObject(object[i]);
      for (const x in flatObject1) {
        if (!flatObject1.hasOwnProperty(x)) continue;

        toReturn[i + "." + x] = flatObject1[x];
      }
    } else {
      toReturn[i] = object[i];
    }
  }
  return toReturn;
}

module.exports = {
  flatObject,
};
