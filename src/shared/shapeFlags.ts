export enum ShapeFlags {
  ELEMENT = 1,
  STATEFUL_COMPONENT = 1 << 1,
  TEXT_CHILDREN = 1 << 2,
  ARRAY_CHILDREN = 1 << 3,
  SLOT_CHILDREN = 1 << 4,
}

// | 运算符逻辑，同时为 0 才是 0，（只要有 1 就是 1）
// & 运算符逻辑，同时为 1 才是 1，（只要有 0 就是 0）