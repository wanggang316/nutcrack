declare module "turndown" {
  interface Rule {
    filter: string | string[] | ((node: Node, options?: unknown) => boolean);
    replacement: (content: string, node: Node, options?: unknown) => string;
  }

  interface TurndownOptions {
    headingStyle?: "setext" | "atx";
    codeBlockStyle?: "indented" | "fenced";
    emDelimiter?: "_" | "*";
  }

  export default class TurndownService {
    constructor(options?: TurndownOptions);
    use(plugin: unknown): void;
    addRule(key: string, rule: Rule): void;
    turndown(input: string | Node): string;
  }
}

declare module "turndown-plugin-gfm" {
  export const gfm: unknown;
}
