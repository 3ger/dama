
export class TemplateLoader {
   private static readonly templatePath: string = "/dama/interaction/templates/";

   /**
    * Loads given template into given HtmlElement
    *
    * @param templateName Template name to load
    * @param attachTo Element to insert template into
    */
   public static async loadTemplate(templateName: string, insertInto: HTMLElement): Promise<boolean> {

      let path = TemplateLoader.templatePath + templateName + ".html";
      try {
         let response = await fetch(path);
         let content = await response.text();
         insertInto.innerHTML = content;
         return true;
      }
      catch {
         return false;
      }
   }
}
