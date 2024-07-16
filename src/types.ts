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
   * api 基础路径
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

/**
 * 常见的 HTTP 方法
 */
export type IHttpMethod = 'get' | 'post' | 'put' | 'delete';

/**
 * 常见的H HTTP 方法
 */
export enum EHttpMethod {
  get = 'get',
  post = 'post',
  put = 'put',
  delete = 'delete',
}

/**
 * 常见的 HTTP 状态码
 */
export enum EHttpCode {
  OK = '200',
  CREATED = '201',
}

/**
 * Mustache 接口文件数据源 list item
 */
export interface IServicesViewListItem {
  /**
   * 接口对应的命名空间
   */
  namespace: string;
  /**
   * 接口简介
   */
  summary: string;
  /**
   * 接口路径
   */
  path: string;
  /**
   * 接口标签
   */
  tags: string;
  /**
   * 接口名称
   */
  name: string;
  /**
   * 是否为参数路径 形如/a/b/{id}
   */
  isParamPath: boolean;
  /**
   * 是否包含参数
   */
  hasParams: boolean;
  /**
   * 参数类型
   */
  paramsType: string;
  /**
   * 是否包含请求体
   */
  hasBody: boolean;
  /**
   * 请求体类型
   */
  bodyType: string;
  /**
   * HTTP 方法
   */
  method: string;
  /**
   * 是否包含响应
   */
  hasRes: boolean;
  /**
   * 响应类型
   */
  resType: string;
  /**
   * 实际请求路径
   */
  requestPath: string;
}

/**
 * Mustache 接口文件数据源
 */
export interface IServicesView {
  /**
   * 数据源 list
   */
  list: IServicesViewListItem[];
  /**
   * 类型文件名称
   */
  typesFileName: string;
}

/**
 * Mustache 类型文件数据源 list item
 */
export interface ITypesViewListItem {
  /**
   * 接口命名空间
   */
  namespace: string;
  /**
   * 接口简介
   */
  summary: string;
  /**
   * 接口路径
   */
  path: string;
  /**
   * 接口标签
   */
  tags: string;
  /**
   * 是否为参数路径 形如/a/b/{id}
   */
  isParamPath: boolean;
  /**
   * 类型文本
   */
  typeText: string;
}

/**
 * Mustache 类型文件数据源
 */
export interface ITypesView {
  /**
   * 数据源 list
   */
  list: ITypesViewListItem[];
}
