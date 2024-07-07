import { IConfig } from '@/types';
import { genConfigs } from '@/utils';
import { Generator } from '@/generator';

const run = async (customConfig: IConfig) => {
  const config = genConfigs(customConfig);
  console.info('config', config);

  const generator = new Generator();
  generator.init();
};

export default run;
