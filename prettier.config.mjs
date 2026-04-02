export default {
  // 统一保留分号，避免 ASI 边界场景产生歧义。
  semi: true,
  // 字符串统一使用单引号，和仓库现有 TS 风格保持一致。
  singleQuote: true,
  // 多行对象、数组、参数列表保留尾随逗号，便于维护更干净的 diff。
  trailingComma: 'all',
};
