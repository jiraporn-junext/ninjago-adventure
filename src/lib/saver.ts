export function downloadSave(json: string, filename = "ninjago-adventure-spar.json"): void {
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export function readSaveFile(file: File): Promise<string> {
  return file.text();
}
