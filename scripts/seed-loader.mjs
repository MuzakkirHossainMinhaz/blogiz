import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const target = path.join(srcRoot, specifier.slice(2));
    return nextResolve(pathToFileURL(`${target}.ts`).href, context);
  }

  if ((specifier.startsWith("./") || specifier.startsWith("../")) && !path.extname(specifier)) {
    return nextResolve(`${specifier}.ts`, context);
  }

  return nextResolve(specifier, context);
}
