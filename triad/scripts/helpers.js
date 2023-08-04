function addStaticConstants(classObject, staticConstants) {
    const objectProperties = Object.keys(staticConstants).reduce((obj, key) => {
        const newObj = obj;

        const constantInfo = {
            value: staticConstants[key],
            writable : false,
            configurable : false,
        };

        newObj[key] = constantInfo;

        return newObj;
    }, {});

    Object.defineProperties(classObject, objectProperties);
}
