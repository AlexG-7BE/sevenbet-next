declare module "sharp" {
  type SharpPipeline = {
    composite: (inputs: Array<{ blend: string; input: Buffer }>) => SharpPipeline;
    toFile: (path: string) => Promise<unknown>;
    webp: (options: { quality: number }) => SharpPipeline;
  };

  type SharpFactory = (input: Buffer | { create: { background: string; channels: 4; height: number; width: number } }) => SharpPipeline;
  const sharp: SharpFactory;
  export default sharp;
}
