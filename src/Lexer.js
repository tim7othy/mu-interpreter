export class Token {
  constructor(type, literal, lineno) {
    this.type = type
    this.literal = literal
    this.lineno = lineno
  }
}

export class Lexer {
  constructor(sourceCode) {
    this.initTokenTypes()
    this.sourceCode = sourceCode
    this.position = 0
    this.lineno = 0
    this.ch = ''
  }

  initTokenTypes() {
    this.ILLEGAL = -2
    this.EOF = -1
    this.LET = 0
    this.IDENTIFIER = 1
    this.EQUAL_SIGN = 2
    this.PLUS_SIGN = 3
    this.INTEGER = 4
    this.SEMICOLON = 5
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
  }

  // 忽略空白符
  skipWhiteChars() {
    let c = this.peekChar()
    while (c === ' ' || c === '\n' || c === '\t') {
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
    console.log(tok)

    if (tok === null || tok === undefined) {
      throw new Error("无法解析单词")
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
      console.log(c)
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
      tok = new Token(this.IDENTIFIER, str, this.lineno)
    }
    return tok

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