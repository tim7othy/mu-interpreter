export class Token {
  constructor(type, literal, lineno) {
    this.type = type
    this.literal = literal
    this.lineno = lineno
  }
}

export class Lexer {
  constructor(sourceCode) {
    this.initTokenTypeTable()
    this.initKeywordTable()
    this.sourceCode = sourceCode
    this.position = 0
    this.lineno = 0
    this.ch = ''

    // 当前正在被解析的token的位置
    this.currTokBegin = 0
    this.currTokEnd = 0

    this.observers = new Set()
  }

  initTokenTypeTable() {
    this.ILLEGAL = -2
    this.EOF = -1
    this.LET = 0
    this.IDENTIFIER = 1
    this.EQUAL_SIGN = 2
    this.PLUS_SIGN = 3
    this.INTEGER = 4
    this.SEMICOLON = 5
    this.IF = 6
    this.ELSE = 7
    this.tokenTypes = new Map([
      [this.ILLEGAL, "ILLEGAL"],
      [this.EOF, "EOF"],
      [this.LET, "LET"],
      [this.IDENTIFIER, "IDENTIFIER"],
      [this.EQUAL_SIGN, "EQUAL_SIGN"],
      [this.PLUS_SIGN, "PLUS_SIGN"],
      [this.INTEGER, "INTEGER"],
      [this.SEMICOLON, "SEMICOLON"],
      [this.IF, "IF"],
      [this.ELSE, "ELSE"],
    ])
  }

  initKeywordTable() {
    this.keywords = new Map([
      ["let", this.LET],
      ["if", this.IF],
      ["else", this.ELSE]
    ])
  }

  // 注册一个观察者对象，每解析一个token会调用observer的notify方法
  registerObserver(observer) {
    if (!this.observers.has(observer)) {
      this.observers.add(observer)
    }
  }

  getTypeDescription(type) {
    return this.tokenTypes.get(type)
  }
  // 读取当前position位置的字符但不消耗字符
  peekChar() {
    if (this.position >= this.sourceCode.length) {
      return 0
    } else {
      return this.sourceCode[this.position]
    }
  }

  // 读入并消耗当前position位置的字符
  readChar() {
    this.ch = this.peekChar()
    this.position += 1
    this.currTokEnd += 1
  }

  // 忽略空白符
  skipWhiteChars() {
    let c = this.peekChar()
    // 检测是否为空白符（html中的空格可能以&nbsp;的实体编码形式呈现，普通字符串比较无法识别）
    while (c && (c.charCodeAt(0) === 160 || c === ' ' || c === '\n' || c === '\t')) {
      if (c === '\n' || c === '\t') {
        this.lineno += 1
      }
      this.readChar()
      c = this.peekChar()
    }
  }

  _isDigit(c) {
    // 这里有点坑，0 >= '0' 是成立的
    // 所以还需要判断 0
    return c !== 0 && c >= '0' && c <= '9'
  }

  _isLetter(c) {
    return (c >= 'a' && c <= 'z')
     || (c >= 'A' && c <= 'Z')
  }

  _isUnderscore(c) {
    return c === '_'
  }

  nextToken() {
    this.skipWhiteChars()

    let c = this.peekChar()
    let lineno = this.lineno
    // 左闭右开区间
    this.currTokBegin = this.currTokEnd = this.position
    let tok

    if (c === '+') {
      tok = new Token(this.PLUS_SIGN, '+', lineno)
      this.readChar()
    } else if (c === '=') {
      tok = new Token(this.EQUAL_SIGN, '=', lineno)
      this.readChar()
    } else if (c === ';') {
      tok = new Token(this.SEMICOLON, ';', lineno)
      this.readChar()
    } else if (c === 0) {
      tok = new Token(this.EOF, null, lineno)
      this.readChar()
    } else {
      tok = this.readNumber()
      if (!tok) {
        tok = this.readIdentifier()
      }
    }

    if (tok !== null && tok !== undefined) {
      // 通知所有注册的观察者已经解析完的一个token
      // 以及token在源码中的开始和结束为止
      this.observers.forEach((o) => {
        o.notify(tok, this.currTokBegin, this.currTokEnd)
      })
    } else {
      throw new Error(`无法解析单词, lineno:${this.lineno}`)
    }

    return tok
  }

  readNumber() {
    let c = this.peekChar()
    let str = ''
    let tok = null
    while (this._isDigit(c)) {
      str += c
      this.readChar()
      c = this.peekChar()
    }
    if (str !== '') {
      tok = new Token(this.INTEGER, parseInt(str), this.lineno)
    }
    return tok
  }

  readIdentifier() {
    let c = this.peekChar()
    let str = ''
    let tok = null
    while (this._isUnderscore(c) || this._isLetter(c)) {
      str += c
      this.readChar()
      c = this.peekChar()
    }
    if (str !== '') {
      let keyword = this.searchKeywordTable(str)
      if (keyword === null) {
        tok = new Token(this.IDENTIFIER, str, this.lineno)
      } else {
        tok = keyword
      }
    }
    return tok

  }

  searchKeywordTable(word) {
    let keywordType = this.keywords.get(word)
    if (keywordType === undefined || keywordType === null) {
      return null
    } else {
      return new Token(keywordType, word, this.lineno)
    }
  }

  lexing() {
		let tokens = []
    let token = this.nextToken()
		while(token.type !== this.EOF) {
			tokens.push(token)
			token = this.nextToken()
    }
    return tokens
  }
}