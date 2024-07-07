export interface IConfig {
  /**
   * Swagger 文档路径
   */
  origin: string;
  /**
   * 模板目录
   */
  templateDir: string;
  /**
   * 输出目录
   */
  outputDir?: string;
  /**
   * 接口文件名称
   */
  servicesFileName: string;
  /**
   * 类型文件名称
   */
  typesFileName: string;
  /**
   * 返回类型为 blob 的接口项
   */
  blobItems?: string[];
  /**
   * 要包含的接口项
   */
  includeItems?: string[];
  /**
   * 排除的接口项
   */
  excludeItems?: string[];
}
