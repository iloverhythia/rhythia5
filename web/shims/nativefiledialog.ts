import { vfs } from "./vfs";
// Native dialogs become browser file pickers. Picked files are copied into the virtual FS under upload/.
function pick(accept: string, dir = false, multiple = false): Promise<File[]> {
  return new Promise((res) => {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = accept; inp.multiple = multiple || dir;
    if (dir) (inp as any).webkitdirectory = true;
    inp.style.display = "none"; document.body.appendChild(inp);
    let done = false;
    const finish = (f: File[]) => { if (done) return; done = true; inp.remove(); res(f); };
    inp.onchange = () => finish([...(inp.files || [])]);
    (inp as any).oncancel = () => finish([]);
    window.addEventListener("focus", () => setTimeout(() => finish([...(inp.files || [])]), 600), { once: true });
    inp.click();
  });
}
function acceptOf(filters: any) {
  if (!filters || typeof filters !== "object") return "";
  return Object.values(filters).flatMap((v: any) => String(v).split(",")).map((e) => "." + e.trim().replace(/^\./, "")).join(",");
}
export async function openDialog(filters?: any): Promise<string | null> {
  const files = await pick(acceptOf(filters));
  if (!files.length) return null;
  const f = files[0]; const p = `upload/${Date.now()}/${f.name}`;
  vfs.put(p, new Uint8Array(await f.arrayBuffer()), false);
  return p;
}
export async function openFolderDialog(): Promise<string | null> {
  const files = await pick("", true);
  if (!files.length) return null;
  const base = `upload/${Date.now()}`;
  for (const f of files) {
    const rel = (f as any).webkitRelativePath || f.name;
    const name = rel.split("/").pop();
    vfs.put(`${base}/${name}`, new Uint8Array(await f.arrayBuffer()), false);
  }
  return base;
}
export async function saveDialog(): Promise<string | null> { return null; }
export default { openDialog, openFolderDialog, saveDialog };
