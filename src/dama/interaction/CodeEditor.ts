import * as CodeFlask from "codeflask";
import { Manipulation } from "../DamaModel";
import { TemplateLoader } from "./TemplateLoader";


/** TODO: REWORK! */
export class CodeEditor {

   private codeChangedCallbacks: Array<(code: string) => void>;
   private editor: CodeFlask.default;
   private parentElement: HTMLDivElement;
   private templateLoaded: boolean;

   constructor(language: string, public manipulation: Manipulation) {
      this.codeChangedCallbacks = [];
      this.parentElement = window.document.createElement("div");
      this.editor = new CodeFlask.default(this.parentElement,
         { language: language, lineNumbers: true });
      this.editor.onUpdate((code) => {
         this.manipulation.code = code;
         this.codeChangedCallbacks.forEach(element => {
            element(code);
         });
      });
   }

   private setCode(code: string) {
      this.editor.updateCode(code);
   }

   show() {
      if (this.templateLoaded) {
         this.showInternal();
      }
      else {
         TemplateLoader.loadTemplate("CodeEditor").then(result => {
            if (result) {
               this.templateLoaded = true;
               this.showInternal();
            }
         });
      }
   }

   private showInternal() {
      let el = <HTMLDivElement>window.document.getElementById("codeEditorCloseBtn");
      el.onpointerdown = (e) => {
         if (this.parentElement.parentElement)
            this.hide();
      };
      this.setCode(this.manipulation.code);
      let appendTo = window.document.getElementById("codeEditorContent");
      appendTo.appendChild(this.parentElement);
      let modal = window.document.getElementById("codeEditorModal") as HTMLDivElement;
      modal.style.display = "block";
   }

   hide() {
      this.parentElement.parentElement.removeChild(this.parentElement);
      window.document.getElementById("codeEditorModal").style.display = "none";
   }

   /**
    * Adds listener to onUpdate event.
    * @param callback the fn to call on event
    */
   onCodeChanged(callback: (code: string) => void): CodeEditor {
      if (!this.codeChangedCallbacks.find((fn) => callback === fn)) {
         this.codeChangedCallbacks.push(callback);
      }
      return this;
   }
}
