import * as fs from 'fs';
import type { WriteFileOptions } from 'fs';
import * as path from 'path';
import * as Mustache from 'mustache';
import prettier from 'prettier';
import type { OpenAPIV3 } from 'openapi-types';

import type { IConfig } from '@/types';

export class Generator {
  #config: IConfig;

  #doc: OpenAPIV3.Document;

  constructor(config: IConfig, doc: OpenAPIV3.Document) {
    this.#config = config;
    this.#doc = doc;
  }

  async #parse() {
    let pathKeys: string[] = Object.keys(this.#doc.paths) || [];
    const includePaths = this.#config.includePaths || [];
    const excludePaths = this.#config.excludePaths || [];

    if (includePaths.length > 0) {
      const includePathsSet = new Set<string>();
      for (let i = 0; i < includePaths.length; i += 1) {
        includePathsSet.add(includePaths[i]);
      }
      pathKeys = pathKeys.filter((i) => includePathsSet.has(i));
    }

    if (excludePaths.length > 0) {
      const excludePathsSet = new Set<string>();
      for (let i = 0; i < excludePaths.length; i += 1) {
        excludePathsSet.add(excludePaths[i]);
      }
      pathKeys = pathKeys.filter((i) => !excludePathsSet.has(i));
    }

    if (this.#config.baseURL) {
      pathKeys = pathKeys.map((i) => i.replace(this.#config.baseURL!, ''));
    }

    // console.info('pathKeys,', pathKeys);
    // for (let i = 0; i < pathKeys.length; i += 1) {
    //   const pathItemObj = this.#doc.paths[
    //     pathKeys[i]
    //   ] as OpenAPIV3.PathItemObject;
    //   // console.info(pathItemObj);
    // }
  }

  async #writeServices() {
    const outputDir = this.#config.outputDir as string;
    const templateDir = this.#config.templateDir as string;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileOptions = { encoding: 'utf-8' } as WriteFileOptions;
    const servicesPath = path.join(
      this.#config.outputDir!,
      this.#config.servicesFileName!,
    );

    const servicesHeaderPath = path.join(
      templateDir,
      'services-header.mustache',
    );
    if (!fs.existsSync(servicesHeaderPath)) {
      throw new Error(`模版文件${servicesHeaderPath}不存在`);
    }
    const servicesHeaderTemplate = fs.readFileSync(
      servicesHeaderPath,
      fileOptions,
    );
    const servicesHeaderText = Mustache.render(
      servicesHeaderTemplate as string,
      {},
    );
    fs.writeFileSync(servicesPath, servicesHeaderText, fileOptions);

    const servicesItemsPath = path.join(templateDir, 'services-items.mustache');
    if (!fs.existsSync(servicesItemsPath)) {
      throw new Error(`模版文件${servicesItemsPath}不存在`);
    }
    const servicesItemsTemplate = fs.readFileSync(
      servicesItemsPath,
      fileOptions,
    );
    const servicesItemsText = Mustache.render(
      servicesItemsTemplate as string,
      {},
    );
    const formatedText = await prettier.format(
      `${servicesHeaderText}${servicesItemsText}`,
      {
        parser: 'babel-ts',
        singleQuote: true,
      },
    );

    fs.writeFileSync(servicesPath, formatedText, fileOptions);
  }

  #writeServicesTypes() {}

  init() {
    this.#parse();
    this.#writeServices();
    this.#writeServicesTypes();
  }
}
