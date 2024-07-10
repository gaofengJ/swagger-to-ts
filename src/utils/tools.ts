/**
 * path 转换成大驼峰的字符串
 * @param path 路径
 * @returns 转换后的字符串
 * @example /daily-task/import -> DailyTaskImport
 */
export const pathToPascalCase = (path: string): string => {
  // 分割路径为各个部分
  const parts = path.split(/[-/]/);

  // 将每个部分的首字母大写，然后拼接在一起
  const pascalCase = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  return pascalCase;
};

/**
 * 去除字符串中的{#}
 * @param str 字符串
 * @returns 转换后的字符串
 * @example deleteSourceTradeCal{id} -> deleteSourceTradeCal
 */
export const removeBraces = (str: string): string => {
  return str.replace(/\{.*\}/, '');
};
