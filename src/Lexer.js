export class Lexer {
    constructor(tokenizer) {
        this.tokenizer = tokenizer
        this.observers = new Set()
    }

    // 注册一个观察者对象，每解析一个token会调用observer的notify方法
    registerObserver(observer) {
        if (!this.observers.has(observer)) {
            this.observers.add(observer)
        }
    }

    nextToken() {
        let tok = this.tokenizer.next()
        if (tok !== null && tok !== undefined) {
            // 通知所有注册的观察者已经解析完的一个token
            this.observers.forEach((o) => {
                // 告诉观察者token在代码块中的开始与结束位置
                // 是一个左闭右开区间
                o.notify(tok, tok.pos, new String(tok.value).length + tok.pos)
            })
        }
        return tok
    }

    lexing() {
        let tokens = []
        let token = null
        while ((token = this.nextToken()) !== null) {
            tokens.push(token)
        }
        return tokens
    }
}