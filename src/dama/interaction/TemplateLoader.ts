
export class TemplateLoader {
   private static readonly templatePath: string = "/dama/interaction/templates/";
   private static store: Map<string, Array<HTMLElement>> = new Map<string, Array<HTMLElement>>();


   /// TODO: create a way to get the element (insertedInto<<<) also, this can be optimized later on
   /**
    * Loads given template into given HtmlElement
    *
    * @param templateName Template name to load
    * @param attachTo Element to insert template into, if element already will not add unless addDuplicate is set.
    * @param addDuplicate
    */
   public static async loadTemplate(
      templateName: string,
      insertInto?: HTMLElement,
      addDuplicate?: boolean): Promise<boolean> {

      let tmpEl = this.store.get(templateName);
      if (tmpEl !== undefined && !addDuplicate) {
         if (tmpEl.find(x => x === insertInto)) return true;
      }

      try {
         if (!tmpEl || addDuplicate) {
            let path = TemplateLoader.templatePath + templateName + ".html";
            let response = await fetch(path);
            let content = await response.text();

            if (!insertInto)
               insertInto = document.body.appendChild(document.createElement("div"));

            insertInto.innerHTML = addDuplicate ? insertInto.innerHTML + content : content;

            if (tmpEl)
               tmpEl.push(insertInto);
            else
               this.store.set(templateName, [insertInto]);

            // Also add scripts
            TemplateLoader.addScripts(insertInto);
         }
         return true;
      }
      catch {
         return false;
      }
   }

   private static addScripts(parent: Node) {
      parent.childNodes.forEach(node => {
         if (node.nodeName === "SCRIPT") {
            var scriptNode = document.createElement("script");
            scriptNode.text = node.textContent;
            node.parentNode.replaceChild(scriptNode, node);
         }

         if (node.childNodes && node.childNodes.length > 0)
            TemplateLoader.addScripts(node);
      });
   }
}
