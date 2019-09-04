import {
    Lexer
} from './Lexer';
import '@babel/polyfill';
import {
    InputSystem
} from './Input';
import {
    Parser
} from './Parser'
import {
    evaluate,
    Environment
} from './Interpreter'
class IDE {
    constructor() {
        this.root = document.querySelector("#root");
        this.template = `
            <div id="ide">
                <div class="ide_header">
                    <h1 class="ide_title">Mu IDE</h1>
                    <div class="ide_button">编译</div>
                </div>
                <div class="ide_main">
                    <div class="ide_editor" contenteditable=true>
                    </div>
                    <div class="ide_display"></div>
                </div>
                <div class="ide_console_wrapper">
                    <div class="ide_console_title"> 输出 </div>
                    <div class="ide_console"></div>
                </div>
            </div>
        `
        this.root.insertAdjacentHTML("beforeend", this.template);
        this.elem = document.querySelector("#ide");
        this.editor = this.elem.querySelector(".ide_editor")
        this.editor.innerHTML = `
            <div>println("Hello World!");</div><br>

            <div># this is a comment</div><br>

            <div>println(2 + 3 * 4);</div><br>

            <div>fib = lambda (n) if n < 2 then n else fib(n - 1) + fib(n - 2);</div><br>

            <div>fib(15);</div><br>
        `
        this.display = this.elem.querySelector(".ide_display")
        this.console = this.elem.querySelector(".ide_console")
        this.btn = this.elem.querySelector(".ide_button")
        this.input = new InputSystem("")
        this.lexer = new Lexer(this.input)
        this.parser = new Parser(this.lexer)
        this.bindEvents()
        this.initObservers()
        this.lexing()
    }

    bindEvents() {
        this.btn.addEventListener("click", () => {
            this.console.innerText = ""
            this.compile()
        })
		let debounce = (func, delay) => {
			let timer = null
			return () => {
				if (timer) clearTimeout(timer)
				timer = setTimeout(() => {
					func.call(this)
				}, delay)

			}
		}
		let timer = null
        window.addEventListener("keyup", debounce(() => this.lexing(), 200))
        this.display.addEventListener("mouseover", (ev) => {
            let t = ev.target
            // console.log(`target: ${t.tagName}`)
            // console.log(`relatedTarget: ${rt.tagName}`)
            if (t.tagName.toLowerCase() === "span") {
                let matchObj = t.className.match(/code-(\w+)/)
                if (matchObj) {
                    let type = matchObj[1]
                    if (type === "var" || type === "num" || type === "str") {
                        let bounding = t.getBoundingClientRect()
                        let v = t.dataset.value
                        this.popup(bounding.x, bounding.y, `token类型：${type}\ntoken值：${v}`)
                    }
                } else {
                    this.hidePopup()
                }
            } else {
                this.hidePopup()
            }
        }, true)
    }

    popup(x, y, content) {
        if (!this.popupDiv) {
            let p = `
        <div class="popup-tip">
          <div class="popup-title">tips</div>
          <div class="popup-content">
            ${content}
          </div>
        </div>
      `
            this.display.insertAdjacentHTML("afterend", p)
            this.popupDiv = document.getElementsByClassName("popup-tip")[0]
        } else {
            this.popupDiv.querySelector(".popup-content").innerText = content
        }
        this.popupDiv.style.visibility = "visible"
        this.popupDiv.style.left = x + "px"
        this.popupDiv.style.top = y + 30 + "px"
    }

    hidePopup() {
        if (this.popupDiv) {
            this.popupDiv.style.visibility = "hidden"
        }
    }

    _changeWhiteChars(str) {
        var s = ""
        if (str.length === 1 && str === ' ') {
            // 只有一个连续空格的时候需要将空格转为实体编码，否则会被浏览器吞掉
            // 多个连续空格的时候contenteditable的div会自行转换空格，因此不需要转换
            return '\u00a0'
        }
        for (var i = 0; i < str.length; i++) {
            if (str[i] === '\n') {
                s += '<br>'
            } else {
                s += str[i]
            }
        }

        return s;
    }

    initObservers() {
        this.lastFragmentEnd = 0
        this.fragments = []

        this.keywordHighlightObserver = {
            notify: (tok, begin, end) => {
                // console.log(`begin: ${begin},end: ${end}`)
                // 该关键字和上一个关键字之间的普通代码片段
                if (this.lastFragmentEnd < begin) {
                    let spaceText = this.getContent().substring(this.lastFragmentEnd, begin)
                    let converted = this._changeWhiteChars(spaceText)
                    let spaceFragment = `
            <span class="code-space">${converted}</span>
          `
                    this.fragments.push(spaceFragment)
                }

                let text = this.getContent().substring(begin, end)
                // 高亮关键字代码片段
                if (tok.type === "kw") {
                    let keywordFragment = `
            <span class="code-${tok.type}" style="color:red">${text}</span>
          `
                    this.fragments.push(keywordFragment)
                    this.lastFragmentEnd = end
                } else if (["var", "num", "str"].includes(tok.type)) {
                    let varFragment = `
            <span class="code-${tok.type}" data-value="${tok.value}">${text}</span>
          `
                    this.fragments.push(varFragment)
                    this.lastFragmentEnd = end

                } else {
                    let plainFragment = `
            <span class="code-${tok.type}">${text}</span>
          `
                    this.fragments.push(plainFragment)
                    this.lastFragmentEnd = end
                }
            }
        }
        this.lexer.registerObserver(this.keywordHighlightObserver)
    }

    getContent() {
        let content = this.editor.innerText
        let len = content.length
        let pos = 0
        let index = content.indexOf("\n\n", pos)
        while(index >= 0 && pos < len) {
            content = content.substring(0, index+1) + content.substring(index+2)
            pos = index + 1
            index = content.indexOf("\n\n", pos)
        }
        return content
    }

    render_content() {
        let content = this.fragments.join("")
        this.display.innerHTML = content
        this.fragments = []
    }

    lexing() {
        let code = this.getContent()
        this.input.updateCode(code)
        let tokens = this.lexer.lexing()
        this.render_content()
    }

    compile() {
        const code = this.getContent()
        this.input.updateCode(code)
        const ast = this.parser.parse_toplevel()
        const glob_env = new Environment()
        // 添加全局程序库库
        glob_env.vars.println = (txt) => {
            this.console.innerText += `\n${txt}`
        }
        const result = evaluate(ast, glob_env)
        this.console.innerText += `\n程序运行结果: ${result}`
    }
}

export default IDE;