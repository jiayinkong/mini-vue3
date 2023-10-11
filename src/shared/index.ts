export * from './toDisplayString';

export const extend = Object.assign;

export const isObject = (val) => {
  return val !== null && typeof val === 'object';
}

export const isString = (val) => {
  return typeof val === 'string';
};

export const hasChanged = (val, newVal) => {
  return !Object.is(val, newVal);
}


// 添加 on 前缀，并事件首字母大写
const capitalize = (str: string) => {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// 改为驼峰
export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (_, c: string) => {
    return c ? c.toUpperCase() : '';
  })
}

export const toHandlerKey = (str) => {
  return str ? 'on' + capitalize(str) : '';
}
  