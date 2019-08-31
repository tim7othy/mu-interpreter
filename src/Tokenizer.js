import {
    is_digit,
    is_id,
    is_id_start,
    is_op_char,
    is_punc,
    is_whitespace
} from './utils'

export class Tokenizer {
    constructor(input) {
        this.input = input
        // 当前读取的token
        this.current = null
    }

    // 读取下一个Token
    read_next() {
        this.read_while(is_whitespace)
        if (this.input.eof()) return null
        let ch = this.input.peek()
        if (ch === '#') {
            this.skip_comment()
            return this.read_next()
        }
        if (ch === '"') return this.read_string()
        if (is_digit(ch)) return this.read_number()
        if (is_id_start(ch)) return this.read_identifier()
        if (is_op_char(ch)) return {
            type: "op",
            value: this.read_while(is_op_char)
        }
        if (is_punc(ch)) return {
            type: "punc",
            value: this.input.next()
        }
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
        return {
            type: "num",
            value: parseFloat(str)
        }
    }

    read_string() {
        return {
            type: "str",
            value: this.read_escaped()
        }
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
        let keywords = " if then else lambda λ true false ";
        let id = this.read_while(is_id)
        let is_keyword  = (x) => keywords.indexOf(" " + x + " ") >= 0
        return {
            type: is_keyword(id) ? "kw" : "var",
            value: id
        }
    }

    next() {
        const t = this.current
        // 消耗掉当前的token
        this.current = null
        return t || this.read_next()
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
}