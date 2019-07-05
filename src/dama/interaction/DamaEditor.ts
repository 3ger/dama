import { DamaGraph } from "../visual/DamaGraph";
import { TemplateLoader } from "./TemplateLoader";
import { JsonLoader } from "../core/JsonLoader";
import { EnvironmentConfig } from "../core/EnvironmentConfig";


export class DamaEditor {

   private readonly settingsPath: string = "dama/dama.json";
   private graph: DamaGraph;

   /**
    * @param startElement Div element where Editor is attached to, if empty attached to body.
    */
   constructor(private startElement?: HTMLDivElement) {

      if (!this.startElement) {
         this.startElement = document.createElement("div");
         document.body.appendChild(this.startElement);
      }

      this.startup();

      JsonLoader.load<EnvironmentConfig>(this.settingsPath).then(settings => {
         TemplateLoader.loadTemplate("DamaEditor", this.startElement).then(result => {
            if (result) {
               let canvasElement = <HTMLCanvasElement>window.document.getElementById("maincanvas");
               this.graph = new DamaGraph({
                  viewCanvas: canvasElement,
                  size: { x: canvasElement.offsetParent.clientWidth, y: window.innerHeight * 0.85 },
                  backgroundColor: 0x888888,
                  autoSize: true,
               });
            }
         });
      });
   }

   private startup() {
      window.customElements.define("template-loader", TemplateLoader);
   }
}
