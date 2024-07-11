import * as fs from 'fs';
import type { WriteFileOptions } from 'fs';
import * as path from 'path';
import * as Mustache from 'mustache';
import * as prettier from 'prettier';
import type { OpenAPIV3 } from 'openapi-types';

import type {
  IServicesView,
  IConfig,
  IServicesViewListItem,
  ITypesView,
  ITypesViewListItem,
} from '@/types';
import { EHttpMethod } from '@/types';
import { fileOptions, prettierOptions } from '@/configs';
import { pathToPascalCase, removeBraces } from '@/utils';
import type { PartialsOrLookupFn } from 'mustache';

export class Generator {
  #config: IConfig;

  #doc: OpenAPIV3.Document;

  #fileOptions: WriteFileOptions = fileOptions;

  #servicesView: IServicesView = {
    list: [],
    typesFileName: '',
  };

  #typesView: ITypesView = {
    list: [],
  };

  constructor(config: IConfig, doc: OpenAPIV3.Document) {
    this.#config = config;
    this.#doc = doc;

    this.#servicesView.typesFileName = config.typesFileName!;
  }

  #isParamPath(pathStr: string) {
    return pathStr.indexOf('{id}') > -1;
  }

  #resolveHasParams(operationObject: OpenAPIV3.OperationObject) {
    if (!operationObject.parameters?.length) return false;
    return true;
  }

  #resolveParamsType(
    pathKey: string,
    method: keyof typeof EHttpMethod,
    operationObject: OpenAPIV3.OperationObject,
  ) {
    if (!operationObject.parameters?.length) return 'undefined';
    if (this.#isParamPath(pathKey)) {
      return (
        (operationObject.parameters as OpenAPIV3.ParameterObject[])[0]
          ?.schema as OpenAPIV3.NonArraySchemaObject
      )?.type as OpenAPIV3.NonArraySchemaObjectType;
    }
    return `NS${pathToPascalCase(method)}${removeBraces(pathToPascalCase(pathKey))}.IParams`;
  }

  #resolveHasBody(operationObject: OpenAPIV3.OperationObject) {
    if (!operationObject.requestBody) return false;
    return true;
  }

  #resolveBodyType(
    pathKey: string,
    method: keyof typeof EHttpMethod,
    operationObject: OpenAPIV3.OperationObject,
  ) {
    if (!operationObject.requestBody) return 'undefined';
    return `NS${pathToPascalCase(method)}${removeBraces(pathToPascalCase(pathKey))}.IBody`;
  }

  #resolveHasResponse(operationObject: OpenAPIV3.OperationObject) {
    if (operationObject.responses.default) return true;
    return false;
  }

  #resolveResponseType(
    pathKey: string,
    method: keyof typeof EHttpMethod,
    operationObject: OpenAPIV3.OperationObject,
  ) {
    if (!operationObject.responses.default) return 'void';
    return `NS${pathToPascalCase(method)}${removeBraces(pathToPascalCase(pathKey))}.IRes`;
  }

  #parseServiceItem(
    pathKey: string,
    method: keyof typeof EHttpMethod,
    operationObject: OpenAPIV3.OperationObject,
  ) {
    if (this.#config.baseURL) {
      // eslint-disable-next-line no-param-reassign
      pathKey = pathKey.replace(this.#config.baseURL!, '');
    }
    const item: IServicesViewListItem = {
      namespace: '',
      summary: '',
      path: '',
      tags: '',
      name: '',
      isParamPath: false,
      hasParams: false,
      paramsType: '',
      hasBody: false,
      bodyType: '',
      method: '',
      hasResponse: false,
      responseType: '',
      requestPath: '',
    };
    item.namespace = `NS${pathToPascalCase(method)}${removeBraces(pathToPascalCase(pathKey))}`;
    item.summary = operationObject.summary as string;
    item.path = pathKey;
    item.tags = operationObject.tags?.join(',') as string;
    item.name = `${method}${removeBraces(pathToPascalCase(pathKey))}`;
    item.isParamPath = this.#isParamPath(pathKey);
    item.hasParams = this.#resolveHasParams(operationObject);
    item.paramsType = this.#resolveParamsType(pathKey, method, operationObject);
    item.hasBody = this.#resolveHasBody(operationObject);
    item.bodyType = this.#resolveBodyType(pathKey, method, operationObject);
    item.method = method;
    item.hasResponse = this.#resolveHasResponse(operationObject);
    item.responseType = this.#resolveResponseType(
      pathKey,
      method,
      operationObject,
    );
    item.requestPath = pathKey;

    this.#servicesView.list.push(item);
  }

  #parseTypeItem(
    pathKey: string,
    method: keyof typeof EHttpMethod,
    operationObject: OpenAPIV3.OperationObject,
  ) {
    const item: ITypesViewListItem = {
      namespace: '',
      summary: '',
      path: '',
      tags: '',
      isParamPath: false,
      hasParams: false,
      paramsType: '',
      hasBody: false,
      bodyType: '',
      hasResponse: '',
      responseType: '',
    };
    item.namespace = `NS${pathToPascalCase(method)}${removeBraces(pathToPascalCase(pathKey))}`;
    item.summary = operationObject.summary as string;
    item.path = pathKey;
    item.tags = operationObject.tags?.join(',') as string;
    item.isParamPath = this.#isParamPath(pathKey);
    item.hasParams = this.#isParamPath(pathKey);
    item.paramsType = this.#resolveParamsType(pathKey, method, operationObject); // TODO
    item.hasBody = this.#resolveHasBody(operationObject);
    item.bodyType = this.#resolveHasBody(operationObject); // TODO
    item.hasResponse = this.#resolveHasResponse(operationObject);
    // TODO
    item.responseType = this.#resolveResponseType(
      pathKey,
      method,
      operationObject,
    );

    this.#typesView.list.push(item);
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

    for (let i = 0; i < pathKeys.length; i += 1) {
      const pathKey = pathKeys[i];
      const pathItemObject = this.#doc.paths[
        pathKey
      ] as OpenAPIV3.PathItemObject;
      for (let j = 0; j < Object.keys(pathItemObject).length; j += 1) {
        const operationObject = pathItemObject[
          Object.keys(pathItemObject)[j] as keyof typeof EHttpMethod
        ] as OpenAPIV3.OperationObject;
        this.#parseServiceItem(
          pathKey,
          Object.keys(pathItemObject)[j] as keyof typeof EHttpMethod,
          operationObject,
        );
        this.#parseTypeItem(
          pathKey,
          Object.keys(pathItemObject)[j] as keyof typeof EHttpMethod,
          operationObject,
        );
      }
    }
  }

  async #writeServices() {
    const outputDir = this.#config.outputDir as string;
    const templateDir = this.#config.templateDir as string;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

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
      this.#fileOptions,
    );

    const servicesHeaderText = Mustache.render(
      servicesHeaderTemplate as string,
      {},
    );

    const servicesItemsPath = path.join(templateDir, 'services-items.mustache');
    const servicesItemArgsPath = path.join(
      templateDir,
      'services-item-args.mustache',
    );
    const servicesResPath = path.join(
      templateDir,
      'services-item-res.mustache',
    );
    const servicesItemDataPath = path.join(
      templateDir,
      'services-item-data.mustache',
    );
    if (!fs.existsSync(servicesItemsPath)) {
      throw new Error(`模版文件${servicesItemsPath}不存在`);
    }
    const servicesItemsTemplate = fs.readFileSync(
      servicesItemsPath,
      this.#fileOptions,
    );
    const servicesItemArgsTemplate = fs.readFileSync(
      servicesItemArgsPath,
      this.#fileOptions,
    );
    const servicesItemResTemplate = fs.readFileSync(
      servicesResPath,
      this.#fileOptions,
    );
    const servicesItemDataTemplate = fs.readFileSync(
      servicesItemDataPath,
      this.#fileOptions,
    );
    const partials = {
      servicesItemArgs: servicesItemArgsTemplate,
      servicesItemRes: servicesItemResTemplate,
      servicesItemData: servicesItemDataTemplate,
    };
    const servicesItemsText = Mustache.render(
      servicesItemsTemplate as string,
      this.#servicesView,
      partials as PartialsOrLookupFn,
    );

    const formatedText = await prettier.format(
      `${servicesHeaderText}${servicesItemsText}`,
      prettierOptions,
    );

    fs.writeFileSync(servicesPath, formatedText, this.#fileOptions);
  }

  async #writeServicesTypes() {
    const outputDir = this.#config.outputDir as string;
    const templateDir = this.#config.templateDir as string;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

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
    const typesHeaderTemplate = fs.readFileSync(
      typesHeaderPath,
      this.#fileOptions,
    );
    const typesHeaderText = Mustache.render(
      typesHeaderTemplate as string,
      this.#typesView,
    );

    const typesItemsPath = path.join(
      templateDir,
      'services-types-items.mustache',
    );
    if (!fs.existsSync(typesItemsPath)) {
      throw new Error(`模版文件${typesItemsPath}不存在`);
    }
    const typesItemsTemplate = fs.readFileSync(
      typesItemsPath,
      this.#fileOptions,
    );
    const typesItemsText = Mustache.render(
      typesItemsTemplate as string,
      this.#typesView,
    );
    const formatedText = await prettier.format(
      `${typesHeaderText}${typesItemsText}`,
      prettierOptions,
    );

    fs.writeFileSync(typesPath, formatedText, this.#fileOptions);
  }

  init() {
    this.#parse();
    this.#writeServices();
    this.#writeServicesTypes();
  }
}
