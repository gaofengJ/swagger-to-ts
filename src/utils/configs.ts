import { defaultConfig } from '@/configs';
import { IConfig } from '@/types';

/**
 * 合并配置
 * @param customConfig 默认配置
 * @returns 自定义配置
 */
export const genConfigs = (customConfig: IConfig) => {
  return {
    ...defaultConfig,
    ...customConfig,
  };
};
