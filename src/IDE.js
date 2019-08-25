import {Lexer} from './Lexer'
import '@babel/polyfill'
class IDE {
  constructor() {
    this.root = document.getElementById("root");
    this.template = `
      <div id="ide">
        <div class="ide_title">
          <h1>Mu IDE</h1>
        </div>
        <div class="ide_main">
          <div class="ide_editor" contenteditable=true>
          </div>
          <div class="ide_console"></div>
        </div>
        <button class="ide_button">编译</button>
      </div>
    ` 
    this.root.insertAdjacentHTML("beforeend", this.template);
    this.elem = document.getElementById("ide");
    this.editor = this.elem.getElementsByClassName("ide_editor")[0]
    this.content = this.elem.getElementsByClassName("ide_rendered_content")[0]
    this.console = this.elem.getElementsByClassName("ide_console")[0]
    this.btn = this.elem.getElementsByClassName("ide_button")[0]
    this.bindEvents()
    this.initObservers()
  }

  bindEvents() {
    this.btn.addEventListener("click", () => {
      this.compile()      
    })
    window.addEventListener("keyup", (ev) => {
      this.compile()
    })
  }

  _changeWhiteChars(str) {
    // 只有一个连续空格的时候需要将空格转为实体编码，否则会被浏览器吞掉
    // 多个连续空格的时候contenteditable的div会自行转换空格，因此不需要转换
    var s = ""
    if (str.length > 1)
      return str
    for (var i = 0; i < str.length; i++) {
      if (str[i] === ' ') {
        s += '\u00a0'
      } else if (str[i] === '\n') {
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
        // 该关键字和上一个关键字之间的普通代码片段
        // console.log(`${begin}: ${end},`)
        // console.log(`lastFragmentEnd: ${this.lastFragmentEnd}`)
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
        if (tok.type === 0) {
          let keywordFragment = `
            <span class="code-${tok.type}" style="color:red">${text}</span>
          `
          this.fragments.push(keywordFragment)
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
  }

  getContent() {
    return this.editor.innerText
  }

  _clearTextNodes(node) {
    let childs = node.childNodes
    for (let i = 0; i < childs.length; i++) {
      // 循环到文本或空子节点就删除
      let c = childs[i]
      if (c.nodeName === "#text" && !/\s/.test(c.nodeValue)) {
        node.removeChild(c)
      }
    }
  }

  render_content() {
    let content = this.fragments.join("")
    // let contentDiv = `
    //   <p class="ide_rendered_content">${content}</p>
    // `
    // this._clearTextNodes(this.editor)
    this.console.innerHTML = content
    this.fragments = []
  }

  compile() {
    let code = this.getContent()
    let lexer = new Lexer(code)
    lexer.registerObserver(this.keywordHighlightObserver)
    let tokens = lexer.lexing()
    this.render_content()
  }
}

export default IDE;