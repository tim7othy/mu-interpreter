export class InputSystem {
  constructor(code) {
      this.updateCode(code)
  }
  updateCode(code) {
    this.code = code
    this.line = 0
    this.col = 0
    this.pos = 0
  }
  peek() {
    return this.code[this.pos]
  }
  next() {
    let ch = this.code[this.pos++]
    if (ch === '\n') {
      this.line++
      this.col = 0
    } else {
      this.col++
    }
    return ch
  }
  eof() {
    // 字符数组索引超过下标时会返回undefined
    // 如果使用charAt，则索引超过下标时会返回""
    let ch = this.peek()
    return ch ==="" || ch === undefined
  }
  error(msg) {
    throw new Error(`${msg},line: ${this.line},col: ${this.col}`)
  }
}