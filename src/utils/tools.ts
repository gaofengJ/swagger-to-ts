/**
 * path 转换成大驼峰的字符串
 * @param path 路径
 * @returns 转换后的字符串
 * @example /daily-task/import -> DailyTaskImport
 */
export const pathToPascalCase = (path: string) => {
  return path.replace(/(?:^|\/|-)(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));
};
