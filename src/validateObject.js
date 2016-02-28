import isPlainObject from 'lodash/isPlainObject';
import sortBy from 'lodash/sortBy';

export default function validateObject(obj, query, emitter, dir, path) {
  if (!isPlainObject(obj)) {
    return;
  }

  const used = {};
  const keys = sortBy(Object.keys(obj), (propertyName) => propertyName.length);
  keys.forEach((propertyName) => {
    if (used[propertyName]) {
      return;
    }

    const newPath = path ? `${path}.${propertyName}` : propertyName;
    const value = obj[propertyName];

    if (isPlainObject(value)) {
      validateObject(value, query, emitter, dir, newPath);
      return;
    }

    const propertyNameDefault = propertyName + 'DefaultValue';
    used[propertyName] = true;
    used[propertyNameDefault] = true;

    if (query.defaultValue && query.defaultLocale && keys.indexOf(propertyNameDefault) === -1) {
      const firstDotPos = newPath.indexOf('.');
      emitter(`Missing default value: ${newPath.substr(firstDotPos + 1)} in ${dir}/${query.defaultLocale}.js`);
    }
  });
}