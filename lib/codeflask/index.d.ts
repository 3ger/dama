
interface Options {
   language: string;
   styleParent?: string;
   rtl?: boolean;
   tabSize?: number;
   enableAutocorrect?: boolean;
   lineNumbers?: boolean;
   defaultTheme?: boolean;
   areaId?: string;
   ariaLabelledby?: string;
   readonly?: boolean;
   handleTabs?: boolean;
   handleSelfClosingCharacters?: boolean;
   handleNewLineIndentation?: boolean;
}

declare class CodeFlask {
   constructor(selectorOrElement: string | HTMLElement, opts: Options);
   startEditor(): void;
   createWrapper(): void;
   createTextarea(): void;
   createPre(): void;
   createCode(): void;
   createLineNumbers(): void;
   createElement(elementTag: string, whereToAppend: HTMLElement): HTMLElement;
   runOptions(): void;
   updateLineNumbersCount(): void;
   listenTextarea(): void;
   handleTabs(e: Event): void;
   handleSelfClosingCharacters(e: Event): void;
   setLineNumber(): void;
   handleNewLineIndentation(e: KeyboardEvent): void;
   closeCharacter(char: string): void;
   skipCloseChar(cha: string): boolean;
   updateCode(newCode: string): void;
   updateLanguage(newLanguage: string): void;
   addLanguage(name: string, options: any): void;
   populateDefault(): void;
   highlight(): void;
   onUpdate(callback: (code: string) => void): void;
   getCode(): string;
   runUpdate(): void;
   enableReadonlyMode(): void;
   disableReadonlyMode(): void;
}

declare module "codeflask" {
   export default CodeFlask;
}
