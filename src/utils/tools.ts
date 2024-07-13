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

/**
 * 根据给定的路径查找对象
 * @param data 给定数据
 * @param path 给定路径
 * @returns 查找到的对象
 */
export const findObjectByPath = (data: any, path: string) => {
  // 移除路径前的 `#/`
  const cleanPath = path.replace(/^#\//, '');

  // 将路径拆分成数组
  const parts = cleanPath.split('/');

  // 遍历路径部分来查找对象
  let current = data;
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (current[part] === undefined) {
      throw new Error(`Path not found: ${path}`);
    }
    current = current[part];
  }
  return current;
};

/**
 * 遍历schema，将其中包含scheme的部分替换实际的描述对象
 * @example 将"items": { "$ref": "#/components/schemas/DailyEntity" }中的 $ref替换成 DailyEntity 的描述对象
 * @param data 给丁数据
 * @param schema schema对象
 */
export const replaceReference = (data: any, schema: any) => {
  const len = Object.keys(schema).length;
  for (let i = 0; i < len; i += 1) {
    const key = Object.keys(schema)[i];
    if (key === '$ref') {
      // eslint-disable-next-line no-param-reassign
      schema = findObjectByPath(data, schema[key]);
    }
    if (schema[key] instanceof Object) {
      // eslint-disable-next-line no-param-reassign
      schema[key] = replaceReference(data, schema[key]);
    }
  }
  return schema;
};
