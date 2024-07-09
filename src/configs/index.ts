import * as path from 'path';
import { IConfig } from '@/types';

export const defaultConfig: IConfig = {
  docUrl: '',
  docVersion: '3.0.0',
  baseURL: '/api',
  templateDir: path.resolve(__dirname, '../templates'),
  outputDir: path.resolve(process.cwd(), './src/api'),
  servicesFileName: 'services.ts',
  typesFileName: 'services.types.ts',
  blobPaths: [],
  includePaths: [],
  excludePaths: [],
};

export const httpMethods = ['get', 'post', 'put', 'delete'];
