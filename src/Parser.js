export class Parser {
    constructor(lexer) {
        this.lexer = lexer
        this.PRECEDENCE = {
            "=": 1,
            "||": 2,
            "&&": 3,
            "<": 7,
            ">": 7,
            "<=": 7,
            ">=": 7,
            "==": 7,
            "!=": 7,
            "+": 10,
            "-": 10,
            "*": 20,
            "/": 20,
            "%": 20,
        }
    }

    is_tok(type, value) {
        let tok = this.lexer.peek()
        return tok && tok.type == type && (!value || tok.value == value);
    }

    skip_tok(type, value) {
        if (this.is_tok(type, value)) this.lexer.next();
        else this.lexer.error(`Expecting ${type}: ${value}`);
    }

    parse_atom() {
            if (this.is_tok("punc", "(")) {
                this.lexer.next();
                var exp = this.parse_expression();
                this.skip_tok("punc", ")");
                return exp;
            }
            if (this.is_tok("punc", "{")) return this.parse_prog();
            if (this.is_tok("kw", "if")) return this.parse_if();
            if (this.is_tok("kw", "true") || this.is_tok("kw", "false")) return this.parse_bool();
            if (this.is_tok("kw", "lambda") || this.is_tok("kw", "λ")) {
                this.lexer.next();
                return this.parse_lambda();
            }
            var tok = this.lexer.next();
            if (tok.type == "var" || tok.type == "num" || tok.type == "str")
                return tok;
            this.unexpected();
    }

    parse_expression() {
        return this.expect_call(() => {
            return this.expect_binary(this.parse_atom(), 0);
        });
    }

    expect_call(expr) {
        expr = expr();
        return this.is_tok("punc", "(") ? this.parse_call(expr) : expr;
    }

    expect_binary(left, prec) {
        if (this.is_tok("op")) {
            console.log("executed")
            const op = this.lexer.peek()
            const right_prec = this.PRECEDENCE[op.value]
            const left_prec = prec
            if (right_prec > left_prec) {
                this.lexer.next()
                return {
                    type: op.value == "=" ? "assign" : "binary",
                    operator: op.value,
                    left: left,
                    right: this.expect_binary(this.parse_atom(), right_prec)
                }
            }
        }
        return left
    }

    parse_prog() {
        var FALSE = {
            type: "bool",
            value: false
        };
        var prog = this.delimited("{", "}", ";", this.parse_expression.bind(this));
        if (prog.length == 0) return FALSE;
        if (prog.length == 1) return prog[0];
        return {
            type: "prog",
            prog: prog
        };
    }

    delimited(start, stop, separator, parser) {
        var a = [],
            first = true;
        this.skip_tok("punc", start);
        while (!this.lexer.eof()) {
            if (this.is_tok("punc", stop)) break;
            if (first) first = false;
            else this.skip_tok("punc", separator);
            // the last separator can be missing
            if (this.is_tok("punc", stop)) break;
            a.push(parser());
        }
        this.skip_tok("punc", stop);
        return a;
    }

    parse_call(func_name) {
        return {
            type: "call",
            func: func_name,
            args: this.delimited("(", ")", ",", this.parse_expression.bind(this))
        };
    }

    parse_varname() {
        var name = this.lexer.next();
        if (name.type != "var") this.lexer.error("Expecting variable name");
        return name.value;
    }

    parse_if() {
        this.skip_tok("kw", "if");
        var cond = this.parse_expression();
        console.log(cond)
        if (!this.is_tok("punc", "{")) this.skip_tok("kw", "then");
        var then = this.parse_expression();
        var ret = {
            type: "if",
            cond: cond,
            then: then,
        };
        if (this.is_tok("kw", "else")) {
            this.lexer.next();
            ret.else = this.parse_expression();
        }
        return ret;
    }

    parse_lambda() {
        return {
            type: "lambda",
            vars: this.delimited("(", ")", ",", this.parse_varname.bind(this)),
            body: this.parse_expression()
        };
    }

    parse_bool() {
        return {
            type: "bool",
            value: this.lexer.next().value == "true"
        };
    }

    parse_toplevel() {
        var prog = [];
        while (!this.lexer.eof()) {
            prog.push(this.parse_expression());
            if (!this.lexer.eof()) this.skip_tok("punc", ";");
        }
        return {
            type: "prog",
            prog: prog
        };
    }

    unexpected() {
        this.lexer.error("Unexpected token: " + JSON.stringify(this.lexer.peek()));
    }
}