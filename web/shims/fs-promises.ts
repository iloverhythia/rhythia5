import { promises } from "./fs";
export const { readFile, writeFile, appendFile, mkdir, readdir, stat, lstat, unlink, rm, rmdir, rename, copyFile, access } = promises;
export default promises;
