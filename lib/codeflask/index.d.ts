interface CodeFlaskOptions {
   language?: string
   rtl?: boolean
   tabSize?: number
   enableAutocorrect?: boolean
   lineNumbers?: boolean
   defaultTheme?: boolean
   areaId?: string
   ariaLabelledby?: string
   readonly?: boolean
}

declare class CodeFlask {
   constructor(selectorOrElement: Element | string, opts: CodeFlaskOptions)

   updateCode(newCode: string): void
   updateLanguage(newLanguage: string): void
   addLanguage(name: string, options: any): void

   getCode(): string
   onUpdate(callback: (code: string) => void): void

   disableReadonlyMode(): void
   enableReadonlyMode(): void
}

declare module "codeflask" {
   export default CodeFlask;
}
