export class Log {
   private static environment = { production: false };

   /// Supported placeholder:
   /// DATETIME  - ISO no T, no Z
   /// MESSAGE   - msg given
   private static format = "[DATETIME] MESSAGE";

   private static getLogFormat(message: string): string {
      const d = new Date();
      return Log.format
         .replace("DATETIME", d.toISOString().slice(0, -1).replace("T", " "))
         .replace("MESSAGE", message);
   }

   static log(message: string) {
      if (!this.environment.production) {
         console.log(Log.getLogFormat(message));
      }
   }

   static warn(message: string) {
      if (!this.environment.production) {
         console.warn(Log.getLogFormat(message));
      }
   }

   static err(message: string) {
      if (!this.environment.production) {
         console.error(Log.getLogFormat(message));
      }
   }
}
