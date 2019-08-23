class IDE {
  constructor() {
    this.root = document.getElementById("root");
    this.template = `
      <div id="ide">
        <div class="ide_title><h1>Mu IDE</h1></div>
        <div class="ide_editor" contenteditable=true></div>
      </div>
    ` 
    this.root.insertAdjacentHTML("beforeend", this.template);
    this.elem = document.getElementById("ide");
  }

  getContent() {
    return "hello world"
  }
}

export default IDE