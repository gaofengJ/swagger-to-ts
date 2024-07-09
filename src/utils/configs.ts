import { defaultConfig } from '@/configs';
import { IConfig } from '@/types';

export const genConfigs = (customConfig: IConfig) => {
  return {
    ...defaultConfig,
    ...customConfig,
  };
};
