import { readFile } from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

import { AttachmentData } from "src/lib/exporters/OcxBundleExportCanvas"

export async function attachmentFromLegacyFileUrl(
  url: string,
  title: string
): Promise<AttachmentData> {
  const filePath = fileURLToPath(url)
  const extension = path.extname(filePath).slice(1) || "bin"
  const blob = new Blob([await readFile(filePath)])

  return {
    blob,
    name: `${title}.${extension}`,
  }
}
