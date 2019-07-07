import { Manipulation } from "../DamaModel";
import { TemplateLoader } from "./TemplateLoader";
import * as Monaco from "monaco-editor";

export class CodeEditorMonaco {

   private codeChangedCallbacks: Array<(code: string) => void>;
   private editor: Monaco.editor.IStandaloneCodeEditor;
   private parentElement: HTMLDivElement;
   private templateLoaded: boolean;

   constructor(language: string, public manipulation: Manipulation) {
      this.codeChangedCallbacks = [];
      this.parentElement = window.document.createElement("div");
      this.editor = Monaco.editor.create(this.parentElement, {
         value: manipulation.code,
         language: language,
      });
   }

   private setCode(code: string) {
      this.editor.setValue(code);
   }

   show() {
      if (this.templateLoaded) {
         this.showInternal();
      }
      else {
         TemplateLoader.loadTemplate("CodeEditor", undefined, false).then((result) => {
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
      let appendTo = window.document.getElementById("codeEditorContent");
      appendTo.appendChild(this.parentElement);
      let modal = window.document.getElementById("codeEditorModal") as HTMLDivElement;
      modal.style.display = "block";
      this.editor.layout(<Monaco.editor.IDimension>{
         height: (appendTo as HTMLDivElement).clientHeight,
         width: (appendTo as HTMLDivElement).clientWidth
      });
   }

   hide() {
      this.parentElement.parentElement.removeChild(this.parentElement);
      window.document.getElementById("codeEditorModal").style.display = "none";
   }

   /**
    * Adds listener to onUpdate event.
    * @param callback the fn to call on event
    */
   onCodeChanged(callback: (code: string) => void): CodeEditorMonaco {
      if (!this.codeChangedCallbacks.find((fn) => callback === fn)) {
         this.codeChangedCallbacks.push(callback);
      }
      return this;
   }
}
