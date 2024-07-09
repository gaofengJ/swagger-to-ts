import { IConfig } from '@/types';
import { genConfigs } from '@/utils';
import { Generator } from '@/classes/generator';
import { Swagger } from '@/classes/swagger';

const run = async (customConfig: IConfig) => {
  const config = genConfigs(customConfig);

  if (!config.docUrl) {
    throw new Error('请指定 Swagger 文档地址');
  }

  const swagger = new Swagger(config.docUrl);
  await swagger.fetchSwagger();

  const generator = new Generator(config, swagger.doc);
  generator.init();
};

export default run;
