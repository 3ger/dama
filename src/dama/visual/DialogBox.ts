import { Point } from "./Point";

/**
 * Generic Context Menu used for right click menu's
 */
export class DialogBox {
   private menuElement?: HTMLDivElement;
   private elements: HTMLElement[] = [];

   constructor(question: string, onAnswer: (answer: "yes" | "no") => void, position: Point, context?: any) {
      let btnYes = window.document.createElement("button");
      btnYes.innerHTML = "<i class='fas fa-check'></i> Yes";
      btnYes.type = "button";
      btnYes.className = "btn btn-outline-danger btn-sm";
      btnYes.onclick = (e) => {
         context ? onAnswer.call(context, "yes") : onAnswer("yes");
         this.destroy();
      };
      let btnNo = window.document.createElement("button");
      btnNo.innerHTML = "<i class='fas fa-times'></i> No";
      btnNo.type = "button";
      btnNo.className = "btn btn-outline-secondary btn-sm";
      btnNo.onclick = (e) => {
         context ? onAnswer.call(context, "no") : onAnswer("no");
         this.destroy();
      };
      this.elements.push(btnYes);
      this.elements.push(btnNo);
      this.menuElement = window.document.createElement("div");
      this.menuElement.className = "toast show";
      let header = window.document.createElement("div");
      header.className = "toast-header";
      let title = window.document.createElement("strong");
      title.className = "mr-auto";
      title.innerText = question;
      header.appendChild(title);
      let btnGroup = window.document.createElement("div");
      btnGroup.className = "btn-group";
      btnGroup.setAttribute("style", "padding: .5rem; min-width: 150px;");
      this.elements.forEach(element => {
         btnGroup.appendChild(element);
      });
      this.menuElement.appendChild(header);
      this.menuElement.appendChild(btnGroup);
      this.menuElement.oncontextmenu = (e) => { e.preventDefault(); };
      this.menuElement.style.position = "absolute";
      this.menuElement.style.left = (position.x) + "px";
      this.menuElement.style.top = (position.y) + "px";
   }

   render(): HTMLDivElement {
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
