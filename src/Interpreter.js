export class Environment {
    constructor(parent) {
        this.vars = Object.create(parent ? parent.vars : null)
        this.parent = parent
    }

    extend() {
        return new Environment(this)
    }

    lookup(name) {
        let scope = this
        while (scope) {
            if (Object.prototype.hasOwnProperty.call(scope.vars, name)) {
                return scope
            }
            scope = scope.parent
        }
    }

    get(name) {
        if (name in this.vars) {
            return this.vars[name]
        }
        throw new Error("作用域中无法找到变量: " + name)
    }

    set(name, value) {
        let scope = this.lookup(name)
        if (!scope && this.parent)
            // 该情况下为非全局环境，不能设置或定义未定义的变量
            throw new Error("Undefined variable " + name);
        return (scope || this).vars[name] = value
    }

    def(name, value) {
        return this.vars[name] = value
    }
}

export const evaluate = function (expr, env) {
    switch(expr.type) {
        case "num":
        case "str":
        case "bool":
            return expr.value
        case "var":
            return env.get(expr.value)
        case "prog":
            let val = false;
            expr.prog.forEach(function(expr){ val = evaluate(expr, env) });
            return val;
        case "assign":
            // 赋值表达式左子节点需要为变量类型
            if (expr.left.type != "var")
                throw new Error("Cannot assign to " + JSON.stringify(expr.left));
            return env.set(expr.left.value, evaluate(expr.right, env));
        case "if":
            let cond = evaluate(expr.cond, env)
            if (cond) {
                return evaluate(expr.then, env)
            } else {
                return expr.else ? evaluate(expr.else, env) : false
            }
        case "lambda":
            return function() {
                let params = expr.vars
                let body = expr.body
                // 每次函数运行时都会扩展当前的作用域环境
                // 并且将传入函数的参数添加到扩展的作用域中
                // 函数执行完毕后函数运行环境的作用域会被销毁（因为是局部变量）
                let env_extend = env.extend()
                for (let i = 0; i < params.length; i++) {
                    env_extend.def(params[i], i < arguments.length ? arguments[i] : false)
                }
                return evaluate(body, env_extend)
            }
        case "call":
            // expr.func是变量类型，值为一个函数
            var f = evaluate(expr.func, env);
            return f.apply(null, expr.args.map((arg) => {
                return evaluate(arg, env)
            }))
        case "binary":
            return apply_op(expr.operator, evaluate(expr.left, env), evaluate(expr.right, env))
        default:
            throw new Error("I don't know how to evaluate " + expr.type);
    }
}

function apply_op(op, a, b) {
    function num(x) {
        if (typeof x != "number")
            throw new Error("Expected number but got " + x);
        return x;
    }
    function div(x) {
        if (num(x) == 0)
            throw new Error("Divide by zero");
        return x;
    }
    switch (op) {
      case "+"  : return num(a) + num(b);
      case "-"  : return num(a) - num(b);
      case "*"  : return num(a) * num(b);
      case "/"  : return num(a) / div(b);
      case "%"  : return num(a) % div(b);
      case "&&" : return a !== false && b;
      case "||" : return a !== false ? a : b;
      case "<"  : return num(a) < num(b);
      case ">"  : return num(a) > num(b);
      case "<=" : return num(a) <= num(b);
      case ">=" : return num(a) >= num(b);
      case "==" : return a === b;
      case "!=" : return a !== b;
    }
    throw new Error("Can't apply operator " + op);
}