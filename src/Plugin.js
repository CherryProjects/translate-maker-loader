// import merge from 'lodash/merge';
import get from 'lodash/get';
import fs from 'fs';
import mkdirp from 'mkdirp';
import { each } from 'async';
import keymirror from 'keymirror';

export const Format = keymirror({
  JS: null,
  JSON: null,
});

const Extension = {
  [Format.JS]: '.js',
  [Format.JSON]: '.json',
};

const DEFAULT_OPTIONS = {
  format: Format.JSON,
  encoding: 'utf-8',
};

export default class ExportLocales {
  constructor(options = {}) {
    this._options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
    this._locales = {};

    this.apply = this.apply.bind(this);
    this.addExtractedLocale = this.addExtractedLocale.bind(this);
  }

  getOptions() {
    return this._options;
  }

  addExtractedLocale(extractedLocales, propertyName, callback) {
    const locales = this._locales;

    extractedLocales.forEach((locale) => {
      if (!locales[locale.id]) {
        locales[locale.id] = {};
      }

      const currentLocale = locales[locale];
      currentLocale[propertyName] = locale.data;
    });

    this.save(callback);
  }

  save(callback) {
    const options = this._options;
    const compiler = this._compiler;
    const locales = this._locales;
    const mainDir = options.path || get(compiler, 'options.output.path') || '.';

    const { format, encoding } = options;
    const ext = Extension[format];

    mkdirp(mainDir, (err) => {
      if (err) {
        callback(err);
      }

      each(Object.keys(locales), (locale, cb) => {
        const filePath = mainDir + '/' + locale + ext;
        const jsonContent = JSON.stringify(locales[locale], void 0, 2);
        const result = format === Format.JS
          ? `module.exports = ${jsonContent};`
          : jsonContent;

        fs.readFile(filePath, encoding, (err2, currentContent) => {
          if (!err2 && currentContent === result) {
            return cb();
          }

          fs.writeFile(filePath, result, {
            flag: 'w+',
            encoding,
          }, cb);
        });
      }, callback);
    });
  }

  apply(compiler) {
    this._compiler = compiler;

    compiler.plugin('this-compilation', (compilation) => {
      compilation.plugin('normal-module-loader', (loaderContext) => {
        loaderContext.addExtractedLocale = this.addExtractedLocale;
      });

      compilation.plugin('additional-assets', (callback) => {
        // this.save(callback);
        callback();
      });
    });
  }
}
