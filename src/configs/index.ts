import * as path from 'path';

import prettier from 'prettier';

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

export const prettierOptions: prettier.Options = {
  parser: 'babel-ts',
  singleQuote: true,
  printWidth: 100,
  trailingComma: 'none',
  semi: true,
  tabWidth: 2,
  useTabs: false,
  jsxBracketSameLine: false,
};
