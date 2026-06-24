import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })
dotenv.config({ path: ".env" })

import db from "db"

import { isUnitLessonGrouping } from "./curriculumTypes"
import { importOcx10Package } from "./importOcx10Package"
import { LocalOcx10PackageSource } from "./Ocx10PackageSource"

async function main() {
  const packageRoot = process.argv[2]
  const bundleName = process.argv[3]

  if (!packageRoot) {
    console.error("Usage: npm run import:ocx10 -- <packageRoot> [bundleNamePrefix]")
    process.exit(1)
  }

  const source = new LocalOcx10PackageSource(packageRoot)
  console.log(`Importing OCX 1.0 package from ${source.origin}...`)

  const bundles = await importOcx10Package(db, source, bundleName)

  console.log(`Done. Created ${bundles.length} bundle(s):`)

  for (const ocx10Bundle of bundles) {
    console.log(`  Bundle id: ${ocx10Bundle.prismaBundle.id} — ${ocx10Bundle.prismaBundle.name}`)
    console.log(`    Nodes imported: ${ocx10Bundle.ocxNodes.length}`)
    console.log(`    Root nodes: ${ocx10Bundle.rootNodes.length}`)

    for (const root of ocx10Bundle.rootNodes) {
      const type = root.metadata["@type"]
      const groupName = root.metadata.groupName
      console.log(`      Root: ${root.ocxId} (${type}${groupName ? ` · ${groupName}` : ""})`)

      if (!isUnitLessonGrouping(root.metadata)) {
        console.warn(`      Warning: expected unit-root bundle; got ${type}`)
      }
    }
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
