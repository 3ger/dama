export class JsonLoader {
   public static async load<T>(path: string): Promise<T> {
      let fileContent = await fetch(path);
      return await fileContent.json();
   }
}