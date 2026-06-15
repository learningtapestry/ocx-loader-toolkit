import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })
dotenv.config({ path: ".env" })

import db from "db"

import Ocx10Bundle from "./Ocx10Bundle"

async function main() {
  const packageRoot = process.argv[2]
  const bundleName = process.argv[3]

  if (!packageRoot) {
    console.error("Usage: npm run import:ocx10 -- <packageRoot> [bundleName]")
    process.exit(1)
  }

  const prismaBundle = await db.bundle.create({
    data: {
      name: bundleName || `OCX 1.0 ${packageRoot}`,
      sitemapUrl: "ocx10://local",
    },
  })

  const ocx10Bundle = new Ocx10Bundle(prismaBundle, [])

  console.log(`Importing OCX 1.0 package from ${packageRoot} into bundle ${prismaBundle.id}...`)

  await ocx10Bundle.importFromLocalPackage(db, packageRoot)

  console.log(`Done. Bundle id: ${ocx10Bundle.prismaBundle.id}`)
  console.log(`Nodes imported: ${ocx10Bundle.ocxNodes.length}`)
  console.log(`Root nodes: ${ocx10Bundle.rootNodes.length}`)

  for (const root of ocx10Bundle.rootNodes) {
    console.log(`  Root: ${root.ocxId} (${root.ocxType})`)
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
