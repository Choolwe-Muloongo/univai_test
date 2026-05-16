declare module '*?url' {
  const url: string;
  export default url;
}

declare module 'mammoth/mammoth.browser' {
  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{
    value: string;
    messages?: Array<{ message: string }>;
  }>;
}
