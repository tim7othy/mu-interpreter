import {
    is_digit,
    is_id,
    is_id_start,
    is_op_char,
    is_punc,
    is_whitespace
} from './utils'

export class Token {
    constructor(type, value, pos) {
        this.type = type
        this.value = value
        this.pos = pos
    }
}

export class Lexer {
    constructor(input) {
        this.input = input
        // 当前读取的token
        this.current = null
        this.observers = new Set()
    }

    // 注册一个观察者对象，每解析一个token会调用observer的notify方法
    registerObserver(observer) {
        if (!this.observers.has(observer)) {
            this.observers.add(observer)
        }
    }

    // 读取下一个Token
    read_next() {
        this.read_while(is_whitespace)
        if (this.input.eof()) return null
        const ch = this.input.peek()
        const pos = this.input.pos
        if (ch === '#') {
            this.skip_comment()
            return this.read_next()
        }
        if (ch === '"') return this.read_string()
        if (is_digit(ch)) return this.read_number()
        if (is_id_start(ch)) return this.read_identifier()
        if (is_op_char(ch)) return new Token("op", this.read_while(is_op_char), pos)
        if (is_punc(ch)) return new Token("punc", this.input.next(), pos)

        this.input.error("can't handle character " + ch)
    }

    /**
     * @param {function} test_func 该函数接受一个字符参数
     * 只要读取的字符满足test_func函数，就会一直从输入流读取字符
     */
    read_while(test_func) {
        let str = ""
        let input = this.input
        while (!input.eof() && test_func(input.peek()))
            str += input.next();
        return str;
    }

    skip_comment() {
        // 读取一整行注释
        this.read_while((ch) => ch !== "\n")
        // 消耗掉行尾的换行符
        this.input.next();
    }

    read_number() {
        const pos = this.input.pos
        // 标志已经读取过一个"."
        let has_dot = false
        let str = this.read_while((ch) => {
            // 32.12.toString() 防止有这样的事情发生 :)
            // 如果已经读取过一个"."，再碰到"."就不再继续读入了
            // 如果还没有读取过"."，则表示可以继续读取浮点数
            if (ch === ".") {
                if (has_dot) return false
                has_dot = true
                return true
            }
            return is_digit(ch)
        })
        return new Token("num", parseFloat(str), pos)
    }

    read_string() {
        const pos = this.input.pos
        return new Token("str", this.read_escaped(), pos)
    }

    // 读取可能包含转移符的字符串
    read_escaped() {
        let input = this.input
        // 消耗掉字符串字面量的 " 前缀
        input.next()
        let has_escaped_prefix = false
        let str = ""
        while (!input.eof()) {
            let ch = input.peek()
            if (has_escaped_prefix) {
                // 直接消耗掉转义字符的后继字符
                has_escaped_prefix = false
                str += input.next()
            } else if (ch === '\\') {
                has_escaped_prefix = true
                str += input.next()
            } else if (ch === '"') {
                // 消耗掉字符串字面量的 " 后缀
                input.next()
                break
            } else {
                str += input.next()
            }
        }
        return str
    }

    read_identifier() {
        const pos = this.input.pos
        let keywords = " if then else lambda λ true false ";
        let id = this.read_while(is_id)
        let is_keyword = (x) => keywords.indexOf(" " + x + " ") >= 0
        return new Token(is_keyword(id) ? "kw" : "var", id, pos)
    }

    next() {
        let t = this.current
        // 消耗掉当前的token
        this.current = null
        t = t || this.read_next()

        if (t !== null && t !== undefined) {
            // 通知所有注册的观察者已经解析完的一个token
            this.observers.forEach((o) => {
                // 告诉观察者token在代码块中的开始与结束位置
                // 是一个左闭右开区间
                o.notify(t, t.pos, new String(t.value).length + t.pos)
            })
        }
        return t
    }


    peek() {
        // 如果current为空，则从输入流中读取一个token返回
        // 如果current不为空，则说明上次peek的还没有被消耗，因此直接返回
        if (this.current === null) this.current = this.read_next()
        return this.current
    }

    eof() {
        return this.peek() === null
    }

    error(msg) {
        this.input.error(msg)
    }

    lexing() {
        let tokens = []
        let token = null
        while ((token = this.next()) !== null) {
            tokens.push(token)
        }
        return tokens
    }
}