import * as fs from 'fs';
import type { WriteFileOptions } from 'fs';
import * as path from 'path';
import * as Mustache from 'mustache';
import prettier from 'prettier';
import type { OpenAPIV3 } from 'openapi-types';

import { EHttpMethod, type IConfig } from '@/types';
import { prettierOptions } from '@/configs';
import { pathToPascalCase } from '@/utils';

export class Generator {
  #config: IConfig;

  #doc: OpenAPIV3.Document;

  #servicesView: any;

  #typesVies: any;

  constructor(config: IConfig, doc: OpenAPIV3.Document) {
    this.#config = config;
    this.#doc = doc;
  }

  async #parseGet(pathKey: string, operationObject: OpenAPIV3.OperationObject) {
    const ret = {
      namespace: '',
      summary: '',
      path: '',
      tags: '',
      name: '',
      paramsType: '',
      method: '',
      responseType: '',
      requestPath: '',
    };
    ret.namespace = `NSGet${pathToPascalCase(pathKey)}`;
    ret.summary = operationObject.summary as string;
  }

  async #parsePost(
    pathKey: string,
    operationObject: OpenAPIV3.OperationObject,
  ) {
    const ret = {
      namespace: '',
      summary: '',
      path: '',
      tags: '',
      name: '',
      paramsType: '',
      method: '',
      responseType: '',
      requestPath: '',
    };
    ret.namespace = `NSPost${pathToPascalCase(pathKey)}`;
    ret.summary = operationObject.summary as string;
  }

  async #parsePut(pathKey: string, operationObject: OpenAPIV3.OperationObject) {
    const ret = {
      namespace: '',
      summary: '',
      path: '',
      tags: '',
      name: '',
      paramsType: '',
      method: '',
      responseType: '',
      requestPath: '',
    };
    ret.namespace = `NSPut${pathToPascalCase(pathKey)}`;
    ret.summary = operationObject.summary as string;
  }

  async #parseDelete(
    pathKey: string,
    operationObject: OpenAPIV3.OperationObject,
  ) {
    const ret = {
      namespace: '',
      summary: '',
      path: '',
      tags: '',
      name: '',
      paramsType: '',
      method: '',
      responseType: '',
      requestPath: '',
    };
    ret.namespace = `NSDelete${pathToPascalCase(pathKey)}`;
    ret.summary = operationObject.summary as string;
  }

  async #parse() {
    let pathKeys: string[] = (Object.keys(this.#doc.paths) || []).sort();
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

    for (let i = 0; i < pathKeys.length; i += 1) {
      const pathItemObject = this.#doc.paths[
        pathKeys[i]
      ] as OpenAPIV3.PathItemObject;
      if (pathItemObject[EHttpMethod.get]) {
        const getObject = this.#parseGet(
          pathKeys[i],
          pathItemObject[EHttpMethod.get],
        );
        this.#servicesView.push(getObject);
      }
      if (pathItemObject[EHttpMethod.post]) {
        const getObject = this.#parsePost(
          pathKeys[i],
          pathItemObject[EHttpMethod.post],
        );
        this.#servicesView.push(getObject);
      }
      if (pathItemObject[EHttpMethod.put]) {
        const getObject = this.#parsePut(
          pathKeys[i],
          pathItemObject[EHttpMethod.put],
        );
        this.#servicesView.push(getObject);
      }
      if (pathItemObject[EHttpMethod.delete]) {
        const getObject = this.#parseDelete(
          pathKeys[i],
          pathItemObject[EHttpMethod.delete],
        );
        this.#servicesView.push(getObject);
      }
    }
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
      prettierOptions,
    );

    fs.writeFileSync(servicesPath, formatedText, fileOptions);
  }

  async #writeServicesTypes() {
    const outputDir = this.#config.outputDir as string;
    const templateDir = this.#config.templateDir as string;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileOptions = { encoding: 'utf-8' } as WriteFileOptions;
    const typesPath = path.join(
      this.#config.outputDir!,
      this.#config.typesFileName!,
    );

    const typesHeaderPath = path.join(
      templateDir,
      'services-types-header.mustache',
    );
    if (!fs.existsSync(typesHeaderPath)) {
      throw new Error(`模版文件${typesHeaderPath}不存在`);
    }
    const typesHeaderTemplate = fs.readFileSync(typesHeaderPath, fileOptions);
    const typesHeaderText = Mustache.render(typesHeaderTemplate as string, {});
    fs.writeFileSync(typesPath, typesHeaderText, fileOptions);

    const typesItemsPath = path.join(
      templateDir,
      'services-types-items.mustache',
    );
    if (!fs.existsSync(typesItemsPath)) {
      throw new Error(`模版文件${typesItemsPath}不存在`);
    }
    const typesItemsTemplate = fs.readFileSync(typesItemsPath, fileOptions);
    const typesItemsText = Mustache.render(typesItemsTemplate as string, {});
    const formatedText = await prettier.format(
      `${typesHeaderText}${typesItemsText}`,
      prettierOptions,
    );

    fs.writeFileSync(typesPath, formatedText, fileOptions);
  }

  init() {
    this.#parse();
    this.#writeServices();
    this.#writeServicesTypes();
  }
}
