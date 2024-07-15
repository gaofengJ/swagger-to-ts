import { OpenAPIV3 } from 'openapi-types';

/**
 * Swagger 类，用于处理 Swagger 文档
 */
export class Swagger {
  // swagger 文档路径
  #docUrl: string = '';

  // 从 Swagger 文档路径获取的 JSON 文档
  #doc: OpenAPIV3.Document;

  constructor(docUrl: string) {
    if (!docUrl) throw new Error('请指定 Swagger 文档地址');
    this.#docUrl = docUrl;
  }

  // 从指定的 docUrl 获取 Swagger JSON 文档
  async fetchSwagger() {
    const res = await fetch(this.#docUrl);
    const doc = await res.json();
    this.#doc = doc;
  }

  get doc() {
    return this.#doc;
  }
}
