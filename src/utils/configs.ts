import { baseConfig } from '@/configs';
import { IConfig } from '@/types';

export const genConfigs = (customConfig: IConfig) => {
  return {
    ...baseConfig,
    ...customConfig,
  };
};
