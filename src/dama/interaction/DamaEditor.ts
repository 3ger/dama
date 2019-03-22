import { DamaGraph } from "../visual/DamaGraph";
import { TemplateLoader } from "./TemplateLoader";

export class DamaEditor {

   private graph: DamaGraph;

   /**
    * @param startElement Div element where Editor is attached to, if empty attached to body.
    */
   constructor(private startElement?: HTMLDivElement) {

      if (!this.startElement) {
         this.startElement = document.createElement("div");
         document.body.appendChild(this.startElement);
      }

      TemplateLoader.loadTemplate("DamaEditor", this.startElement).then(result => {
         if (result) {
            let canvEl = <HTMLCanvasElement>window.document.getElementById("maincanvas");
            this.graph = new DamaGraph({
               viewCanvas: canvEl,
               size: { x: canvEl.offsetParent.clientWidth, y: window.innerHeight * 0.85 },
               backgroundColor: 0xEEEEEE
            });
         }
      });
   }
}
