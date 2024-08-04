import * as path from 'path';

import prettier from 'prettier';

import { IConfig } from '@/types';
import { WriteFileOptions } from 'fs';

/**
 * 默认配置
 */
export const defaultConfig: IConfig = {
  docUrl: '',
  docVersion: '3.0.0',
  baseURL: '/api',
  templateDir: path.resolve(__dirname, '../templates'),
  outputDir: path.resolve(process.cwd(), './src/api'),
  servicesFileName: 'services',
  typesFileName: 'services.types',
  blobPaths: [],
  includePaths: [],
  excludePaths: [],
};

/**
 * HTTP 方法
 */
export const httpMethods = ['get', 'post', 'put', 'delete'];

/**
 * Pretter 配置
 */
export const prettierOptions: prettier.Options = {
  // 使用 babel-ts 解析器
  parser: 'babel-ts',
  // 使用单引号代替双引号
  singleQuote: true,
  // 每行最大字符数为 100
  printWidth: 100,
  // 使用分号结尾
  semi: true,
  // 制表符宽度为 2 个空格
  tabWidth: 2,
  // 使用空格代替制表符
  useTabs: false,
  // JSX 语法中，在同一行放置闭合括号
  jsxBracketSameLine: false,
};

/**
 * 文件读写选项
 */
export const fileOptions = { encoding: 'utf-8' } as WriteFileOptions;
