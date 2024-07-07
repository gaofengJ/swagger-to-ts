import path from 'path';
import { IConfig } from '@/types';

export const baseConfig: IConfig = {
  origin: '',
  templateDir: path.resolve(__dirname, 'templates'),
  outputDir: path.resolve(process.cwd(), 'api'),
  servicesFileName: 'services.ts',
  typesFileName: 'services.type.ts',
};
