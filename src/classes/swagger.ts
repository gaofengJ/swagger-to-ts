import { OpenAPIV3 } from 'openapi-types';

export class Swagger {
  #docUrl: string = ''; // swagger 文档路径

  #doc: OpenAPIV3.Document; // swagger json文档

  constructor(docUrl: string) {
    if (!docUrl) throw new Error('请指定 Swagger 文档地址');
    this.#docUrl = docUrl;
  }

  async fetchSwagger() {
    const res = await fetch(this.#docUrl);
    const doc = await res.json();
    this.#doc = doc;
  }

  get doc() {
    return this.#doc;
  }
}
