import { Point } from "./Point";

/**
 * Generic Context Menu used for right click menu's
 */
export class ContextMenu {
   private menuElement?: HTMLDivElement;
   private elements: HTMLElement[] = [];

   constructor(private readonly position: Point) { }

   addButton(text: string, onClick: (e: MouseEvent) => void, context?: any): ContextMenu {
      if (this.menuElement)
         throw new Error("Can not add buttons after rendering.");
      let btn = window.document.createElement("button");
      btn.innerText = text;
      btn.type = "button";
      btn.className = "btn btn-outline-primary";
      btn.onclick = (e) => {
         context ? onClick.call(context, e) : onClick(e);
         this.destroy();
      };
      btn.oncontextmenu = (e) => { e.preventDefault(); };
      this.elements.push(btn);
      return this;
   }

   addSeparationLine(): ContextMenu {
      if (this.menuElement)
         throw new Error("Can not add buttons after rendering.");
      let div = window.document.createElement("hr");
      div.setAttribute("style", "border:dotted #000000 2px; margin: 0; width: -webkit-fill-available; width: -moz-available;");
      div.width = "100";
      div.oncontextmenu = (e) => { e.preventDefault(); };
      this.elements.push(div);
      return this;
   }

   render(): HTMLDivElement {
      if (this.menuElement)
         return this.menuElement;
      this.menuElement = window.document.createElement("div");
      this.menuElement.className = "toast show";
      let btnGroup = window.document.createElement("div");
      btnGroup.className = "btn-group-vertical btn-group-sm";
      btnGroup.setAttribute("style", "padding: .1rem;");
      this.elements.forEach(element => {
         btnGroup.appendChild(element);
      });
      this.menuElement.appendChild(btnGroup);
      this.menuElement.oncontextmenu = (e) => { e.preventDefault(); };
      this.menuElement.style.position = "absolute";
      this.menuElement.style.left = (this.position.x) + "px";
      this.menuElement.style.top = (this.position.y) + "px";
      return this.menuElement;
   }

   destroy() {
      this.elements.forEach(element => {
         element.remove();
      });
      if (this.menuElement)
         this.menuElement.remove();
      this.menuElement = null;
   }
}
