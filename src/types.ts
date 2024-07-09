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
