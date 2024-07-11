export interface IConfig {
  /**
   * Swagger 文档路径，例如：http://127.0.0.1:3000/api-docs-json
   */
  docUrl: string;

  /**
   * Swagger 文档版本
   */
  docVersion?: string;

  /**
   * baseURL
   */
  baseURL?: string;

  /**
   * 自定义模板目录
   */
  templateDir?: string;
  /**
   * 输出目录
   */
  outputDir?: string;
  /**
   * 接口文件名称
   */
  servicesFileName?: string;
  /**
   * 类型文件名称
   */
  typesFileName?: string;
  /**
   * 返回类型为 blob 的接口路径
   */
  blobPaths?: string[];
  /**
   * 要包含的接口路径
   */
  includePaths?: string[];
  /**
   * 要排除的接口路径
   */
  excludePaths?: string[];
}

export type IHttpMethod = 'get' | 'post' | 'put' | 'delete';

export enum EHttpMethod {
  get = 'get',
  post = 'post',
  put = 'put',
  delete = 'delete',
}

export enum EHttpCode {
  OK = '200',
  CREATED = '201',
}

export interface IServicesViewListItem {
  namespace: string;
  summary: string;
  path: string;
  tags: string;
  name: string;
  isParamPath: boolean; // 是否为参数路径 形如/a/b/{id}
  hasParams: boolean;
  paramsType: string;
  hasBody: boolean;
  bodyType: string;
  method: string;
  hasResponse: boolean;
  responseType: string;
  requestPath: string;
}

export interface IServicesView {
  list: IServicesViewListItem[];
  typesFileName: string;
}

export interface ITypesViewListItem {
  namespace: string;
  summary: string;
  path: string;
  tags: string;
  isParamPath: boolean; // 是否为参数路径 形如/a/b/{id}
  hasParams: boolean;
  paramsType: any;
  hasBody: boolean;
  bodyType: any;
  hasResponse: any;
  responseType: any;
}

export interface ITypesView {
  list: ITypesViewListItem[];
}
