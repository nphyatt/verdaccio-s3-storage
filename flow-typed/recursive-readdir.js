declare module 'recursive-readdir' {
  // not complete, just serves how I'm using it
  declare export default function recursiveReaddir(path: string, callback: (err: Error | null, filenames: Array<string>) => void): void;
}
