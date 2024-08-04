import * as fs from 'fs';
import type { WriteFileOptions } from 'fs';
import * as path from 'path';
import * as Mustache from 'mustache';
import { compile } from 'json-schema-to-typescript';
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
import {
  completeSchemaRequired,
  findObjectByPath,
  pathToPascalCase,
  removeBraces,
  replaceReferenceOfObject,
} from '@/utils';
import type { PartialsOrLookupFn } from 'mustache';

export class Generator {
  /**
   * 配置对象
   */
  #config: IConfig;

  /**
   * Swagger 文档对象
   */
  #doc: OpenAPIV3.Document;

  /** 文件读写选项 */
  #fileOptions: WriteFileOptions = fileOptions;

  /**
   * Mustache 接口文件数据源
   */
  #servicesView: IServicesView = {
    list: [],
    typesFileName: '',
  };

  /**
   * Mustache 类型文件数据源
   */
  #typesView: ITypesView = {
    list: [],
  };

  constructor(config: IConfig, doc: OpenAPIV3.Document) {
    this.#config = config;
    this.#doc = doc;

    this.#servicesView.typesFileName = `${config.typesFileName!}.ts`;
  }

  /**
   * 判断路径中是否包含参数
   */
  #isParamPath(pathStr: string): boolean {
    return pathStr.indexOf('{id}') > -1;
  }

  /**
   * 解析字段 hasParams（是否包含参数）
   */
  #resolveHasParams(operationObject: OpenAPIV3.OperationObject): boolean {
    if (!operationObject.parameters?.length) return false;
    return true;
  }

  /**
   * 解析字段 ParamsType（参数类型）
   */
  #resolveParamsType(
    pathKey: string,
    method: keyof typeof EHttpMethod,
    operationObject: OpenAPIV3.OperationObject,
  ): string {
    if (!operationObject.parameters?.length) return '';
    if (this.#isParamPath(pathKey)) {
      return (
        (operationObject.parameters as OpenAPIV3.ParameterObject[])[0]
          ?.schema as OpenAPIV3.NonArraySchemaObject
      )?.type as OpenAPIV3.NonArraySchemaObjectType;
    }
    return `NS${pathToPascalCase(method)}${removeBraces(pathToPascalCase(pathKey))}.IParams`;
  }

  /**
   * 解析字段 hasBody（是否包含请求体）
   */
  #resolveHasBody(operationObject: OpenAPIV3.OperationObject): boolean {
    if (!operationObject.requestBody) return false;
    return true;
  }

  /**
   * 解析字段 bodyType（请求体类型）
   */
  #resolveBodyType(
    pathKey: string,
    method: keyof typeof EHttpMethod,
    operationObject: OpenAPIV3.OperationObject,
  ): string {
    if (!operationObject.requestBody) return '';
    return `NS${pathToPascalCase(method)}${removeBraces(pathToPascalCase(pathKey))}.IBody`;
  }

  /**
   * 解析字段 hasRes（是否包含响应）
   */
  #resolveHasRes(operationObject: OpenAPIV3.OperationObject): boolean {
    if (operationObject.responses.default) return true;
    return false;
  }

  /**
   * 解析字段 resType（响应类型）
   */
  #resolveResType(
    pathKey: string,
    method: keyof typeof EHttpMethod,
    operationObject: OpenAPIV3.OperationObject,
  ): string {
    if (!operationObject.responses.default) return 'void';
    return `NS${pathToPascalCase(method)}${removeBraces(pathToPascalCase(pathKey))}.IRes`;
  }

  /**
   * 解析字段 requestPath（实际请求路径）
   */
  #resolveRequestPath(pathKey: string): string {
    const isParamPath = this.#isParamPath(pathKey);
    if (isParamPath) {
      // eslint-disable-next-line no-template-curly-in-string
      return pathKey.replace(/{id}/g, '${id}');
    }
    return pathKey;
  }

  /**
   * 解析字段 paramsTypeText（参数类型文本）
   */
  #resolveParamsTypeText(
    pathKey: string,
    operationObject: OpenAPIV3.OperationObject,
  ): string {
    // 如果操作对象没有参数或参数列表为空，返回空字符串
    if (!operationObject.parameters?.length) return '';
    // 如果是动态参数路径，返回空字符串
    if (this.#isParamPath(pathKey)) return '';

    const templateDir = this.#config.templateDir as string;
    const typesItemParamsPath = path.join(
      templateDir,
      'services-types-item-params.mustache',
    );
    // 获取类型参数模版内容
    const typesItemParamsTemplate = fs.readFileSync(
      typesItemParamsPath,
      this.#fileOptions,
    );

    // 过滤操作对象中的参数，保留位于查询字符串中的参数
    const paramsList = operationObject.parameters.filter(
      (i: OpenAPIV3.ParameterObject) => i.in === 'query',
    ) as OpenAPIV3.ParameterObject[];

    // 使用 Mustache 渲染模板，将查询参数列表插入模板中
    const paramsTypeText = Mustache.render(typesItemParamsTemplate as string, {
      paramsList,
    });

    return paramsTypeText;
  }

  /**
   * 解析字段 bodyTypeText（请求体类型文本）
   */
  async #resolveBodyTypeText(
    operationObject: OpenAPIV3.OperationObject,
  ): Promise<string> {
    // 尝试获取操作对象中请求体的 JSON schema
    let schema = (operationObject.requestBody as OpenAPIV3.RequestBodyObject)
      ?.content?.['application/json']?.schema as OpenAPIV3.ReferenceObject;

    // 如果 schema 是一个引用对象，通过引用路径在文档中找到实际的 schema 对象
    if (schema?.$ref) {
      schema = findObjectByPath(this.#doc, schema.$ref);
    }

    // 如果 schema 仍然为空，返回空字符串
    if (!schema) return '';

    // 使用编译函数生成请求体类型文本，并指定生成接口名为 'IBody'
    const bodyTypeText = await compile(schema, 'IBody', {
      bannerComment: '',
      unknownAny: false,
    });
    return bodyTypeText;
  }

  /**
   * 解析字段 resTypeText（响应类型文本）
   */
  async #resolveResTypeText(
    operationObject: OpenAPIV3.OperationObject,
  ): Promise<string> {
    // 检查操作对象中是否有默认响应，没有则返回空字符串
    if (!operationObject.responses.default) return '';

    // 尝试获取默认响应体的 JSON schema
    let schema = (
      (
        (operationObject.responses.default as OpenAPIV3.ResponseObject)
          ?.content?.['application/json']?.schema as OpenAPIV3.SchemaObject
      ).allOf?.[1] as OpenAPIV3.SchemaObject
    ).properties?.data as OpenAPIV3.SchemaObject;

    // 如果 schema 为空，则返回空字符串
    if (!schema) return '';

    // 替换 schema 中的引用，获取实际对象
    schema = replaceReferenceOfObject(this.#doc, schema);
    // 补全 schema 的必填字段
    schema = completeSchemaRequired(schema);
    // 使用编译函数生成响应体类型文本，指定生成接口名为 'IRes'
    const resTypeText = await compile(schema, 'IRes', {
      bannerComment: '',
      unknownAny: false,
    });
    return resTypeText;
  }

  /**
   * 解析字段 typeText（类型文本）
   */
  async #resolveTypeText(
    pathKey: string,
    operationObject: OpenAPIV3.OperationObject,
  ): Promise<string> {
    const paramsTypeText = this.#resolveParamsTypeText(
      pathKey,
      operationObject,
    );
    const bodyTypeText = await this.#resolveBodyTypeText(operationObject);
    const resTypeText = await this.#resolveResTypeText(operationObject);
    return `${paramsTypeText}${bodyTypeText}${resTypeText}`;
  }

  /**
   * 解析单个接口
   */
  #parseServiceItem(
    pathKey: string,
    method: keyof typeof EHttpMethod,
    operationObject: OpenAPIV3.OperationObject,
  ): void {
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
      hasRes: false,
      resType: '',
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
    item.hasRes = this.#resolveHasRes(operationObject);
    item.resType = this.#resolveResType(pathKey, method, operationObject);
    item.requestPath = this.#resolveRequestPath(pathKey);

    this.#servicesView.list.push(item);
  }

  /**
   * 解析单个类型
   */
  async #parseTypeItem(
    pathKey: string,
    method: keyof typeof EHttpMethod,
    operationObject: OpenAPIV3.OperationObject,
  ): Promise<void> {
    if (this.#config.baseURL) {
      // eslint-disable-next-line no-param-reassign
      pathKey = pathKey.replace(this.#config.baseURL!, '');
    }
    const item: ITypesViewListItem = {
      namespace: '',
      summary: '',
      path: '',
      tags: '',
      isParamPath: false,
      typeText: '',
    };
    item.namespace = `NS${pathToPascalCase(method)}${removeBraces(pathToPascalCase(pathKey))}`;
    item.summary = operationObject.summary as string;
    item.path = pathKey;
    item.tags = operationObject.tags?.join(',') as string;
    item.isParamPath = this.#isParamPath(pathKey);
    item.typeText = await this.#resolveTypeText(pathKey, operationObject);

    this.#typesView.list.push(item);
  }

  /**
   * 解析 swagger 文档对象获取 Mustache 渲染数据源
   */
  async #parse(): Promise<void> {
    // 获取文档中的所有路径键，并按字母顺序排序
    let pathKeys: string[] = (Object.keys(this.#doc.paths) || []).sort();

    // 获取配置中的包含路径和排除路径
    const includePaths = this.#config.includePaths || [];
    const excludePaths = this.#config.excludePaths || [];

    // 如果包含路径列表不为空，过滤路径键，只保留包含路径中的键
    if (includePaths.length > 0) {
      const includePathsSet = new Set<string>();
      for (let i = 0; i < includePaths.length; i += 1) {
        includePathsSet.add(includePaths[i]);
      }
      pathKeys = pathKeys.filter((i) => includePathsSet.has(i));
    }

    // 如果排除路径列表不为空，过滤路径键，移除排除路径中的键
    if (excludePaths.length > 0) {
      const excludePathsSet = new Set<string>();
      for (let i = 0; i < excludePaths.length; i += 1) {
        excludePathsSet.add(excludePaths[i]);
      }
      pathKeys = pathKeys.filter((i) => !excludePathsSet.has(i));
    }

    // 遍历路径键
    for (let i = 0; i < pathKeys.length; i += 1) {
      const pathKey = pathKeys[i];
      const pathItemObject = this.#doc.paths[
        pathKey
      ] as OpenAPIV3.PathItemObject;

      // 遍历路径项对象中的每个操作对象
      for (let j = 0; j < Object.keys(pathItemObject).length; j += 1) {
        const operationObject = pathItemObject[
          Object.keys(pathItemObject)[j] as keyof typeof EHttpMethod
        ] as OpenAPIV3.OperationObject;

        // 解析接口项
        this.#parseServiceItem(
          pathKey,
          Object.keys(pathItemObject)[j] as keyof typeof EHttpMethod,
          operationObject,
        );
        // 解析类型项
        // eslint-disable-next-line no-await-in-loop
        await this.#parseTypeItem(
          pathKey,
          Object.keys(pathItemObject)[j] as keyof typeof EHttpMethod,
          operationObject,
        );
      }
    }
  }

  /**
   * 写入接口文件
   */
  async #writeServices(): Promise<void> {
    // 获取输出目录和模板目录
    const outputDir = this.#config.outputDir as string;
    const templateDir = this.#config.templateDir as string;

    // 如果输出目录不存在，递归创建目录
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 构建接口文件的路径
    const servicesPath = path.join(
      this.#config.outputDir!,
      `${this.#config.servicesFileName!}.ts`,
    );
    // 构建接口头部模板文件的路径
    const servicesHeaderPath = path.join(
      templateDir,
      'services-header.mustache',
    );

    // 读取接口头部模板文件内容并渲染接口头部模板
    const servicesHeaderTemplate = fs.readFileSync(
      servicesHeaderPath,
      this.#fileOptions,
    );
    const servicesHeaderText = Mustache.render(
      servicesHeaderTemplate as string,
      {},
    );

    // 构建接口项模板文件的路径
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

    // 读取接口项模板文件内容
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

    // 定义 Mustache 部分模板
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

    // 使用 Prettier 格式化生成的文本
    const formatedText = await prettier.format(
      `${servicesHeaderText}${servicesItemsText}`,
      prettierOptions,
    );

    // 将格式化后的文本写入接口文件
    fs.writeFileSync(servicesPath, formatedText, this.#fileOptions);
  }

  /**
   * 写入类型文件
   */
  async #writeTypes() {
    // 获取输出目录和模板目录
    const outputDir = this.#config.outputDir as string;
    const templateDir = this.#config.templateDir as string;

    // 如果输出目录不存在，递归创建目录
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 构建类型文件的路径
    const typesPath = path.join(
      this.#config.outputDir!,
      `${this.#config.typesFileName!}.ts`,
    );

    // 构建类型头部模板文件的路径
    const typesHeaderPath = path.join(
      templateDir,
      'services-types-header.mustache',
    );

    // 读取类型头部模板文件内容并渲染类型头部模板
    const typesHeaderTemplate = fs.readFileSync(
      typesHeaderPath,
      this.#fileOptions,
    );
    const typesHeaderText = Mustache.render(typesHeaderTemplate as string, {});

    // 构建类型项模板文件的路径
    const typesItemsPath = path.join(
      templateDir,
      'services-types-items.mustache',
    );

    // 读取类型项模板文件内容
    const typesItemsTemplate = fs.readFileSync(
      typesItemsPath,
      this.#fileOptions,
    );

    // 渲染类型项模板
    const typesItemsText = Mustache.render(
      typesItemsTemplate as string,
      this.#typesView,
    );

    // 使用 Prettier 格式化生成的文本
    const formatedText = await prettier.format(
      `${typesHeaderText}${typesItemsText}`,
      prettierOptions,
    );

    // 将格式化后的文本写入类型文件
    fs.writeFileSync(typesPath, formatedText, this.#fileOptions);
  }

  /**
   * 初始化
   */
  async init() {
    await this.#parse();
    this.#writeServices();
    this.#writeTypes();
  }
}
