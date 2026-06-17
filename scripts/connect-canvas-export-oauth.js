/**
 * Start the admin export OAuth flow (canvas-oauth2), not a static access token.
 *
 * Prerequisites:
 * 1. App running at TOOLKIT_URL (default http://localhost:3000)
 * 2. Logged into that app in your browser (same host/port as TOOLKIT_URL)
 * 3. Canvas developer key redirect URI must match --callback-path, e.g.:
 *    http://localhost:3000/api/canvas-oauth-export-callback
 * 4. Canvas Instance already created in /admin
 *
 * Usage:
 *   yarn connect:canvas-oauth -- --list
 *   yarn connect:canvas-oauth -- --canvas-instance-id 1 --name "LT Canvas (Instructure)"
 *
 * Env: loads .env.local then .env (needs DATABASE_URL)
 */

const dotenv = require("dotenv")
dotenv.config({ path: ".env.local" })
dotenv.config({ path: ".env" })

const { PrismaClient } = require("@prisma/client")

const TOOLKIT_URL = process.env.TOOLKIT_URL || "http://localhost:3000"
const DEFAULT_CALLBACK_PATH = "/api/canvas-oauth-export-callback"

function encodeState(canvasInstanceId, name, baseUrl, callbackPath) {
  return Buffer.from(
    JSON.stringify({ canvasInstanceId, name, baseUrl, callbackPath })
  ).toString("base64")
}

// Same scopes as src/lib/exporters/repositories/callCanvas.ts
const SCOPE_URLS = [
  "url:POST|/api/v1/courses/:course_id/assignments",
  "url:POST|/api/v1/courses/:course_id/content_migrations",
  "url:GET|/api/v1/courses",
  "url:GET|/api/v1/courses/:id",
  "url:POST|/api/v1/accounts/:account_id/courses",
  "url:POST|/api/v1/courses/:course_id/files",
  "url:POST|/api/v1/courses/:course_id/discussion_topics",
  "url:POST|/api/v1/courses/:course_id/modules",
  "url:POST|/api/v1/courses/:course_id/modules/:module_id/items",
  "url:GET|/api/v1/progress/:id",
  "url:POST|/api/v1/courses/:course_id/quizzes/:quiz_id/questions",
  "url:GET|/api/v1/courses/:course_id/quizzes",
  "url:PUT|/api/v1/courses/:course_id/quizzes/:id",
]

function oauth2AuthLink(canvasInstance, state, redirectUrl, { includeScopes = false } = {}) {
  const params = new URLSearchParams({
    client_id: canvasInstance.clientId,
    response_type: "code",
    redirect_uri: redirectUrl,
    state,
  })

  if (includeScopes) {
    params.set("scope", SCOPE_URLS.join(" "))
  }

  return `${canvasInstance.baseUrl.replace(/\/$/, "")}/login/oauth2/auth?${params.toString()}`
}

function parseArgs(argv) {
  const args = {
    list: false,
    canvasInstanceId: null,
    name: "LT Canvas (Instructure)",
    toolkitUrl: TOOLKIT_URL,
    callbackPath: DEFAULT_CALLBACK_PATH,
    withScopes: false,
  }

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--list") {
      args.list = true
    } else if (arg === "--with-scopes") {
      args.withScopes = true
    } else if (arg === "--callback-path" && argv[i + 1]) {
      args.callbackPath = argv[++i].startsWith("/") ? argv[i] : `/${argv[i]}`
    } else if (arg === "--canvas-instance-id" && argv[i + 1]) {
      args.canvasInstanceId = Number(argv[++i])
    } else if (arg === "--name" && argv[i + 1]) {
      args.name = argv[++i]
    } else if (arg === "--toolkit-url" && argv[i + 1]) {
      args.toolkitUrl = argv[++i].replace(/\/$/, "")
    } else if (arg === "--help" || arg === "-h") {
      args.help = true
    }
  }

  return args
}

function printHelp() {
  console.log(`
Connect a reusable Canvas export destination via OAuth (admin bundle export flow).

Options:
  --list                         List Canvas instances in the database
  --canvas-instance-id <id>      Canvas Instance id from /admin
  --name <name>                  Export destination name (default: "LT Canvas (Instructure)")
  --toolkit-url <url>            Toolkit base URL (default: ${TOOLKIT_URL})
  --callback-path <path>         OAuth redirect path (default: ${DEFAULT_CALLBACK_PATH})
  --with-scopes                  Include export API scopes in the OAuth URL (usually not needed)

Example:
  yarn connect:canvas-oauth -- --canvas-instance-id 2 --name "LT Canvas (Instructure)"
  yarn connect:canvas-oauth -- --canvas-instance-id 2 --with-scopes
`)
}

async function main() {
  const args = parseArgs(process.argv)

  if (args.help) {
    printHelp()
    return
  }

  const db = new PrismaClient()

  try {
    const instances = await db.canvasInstance.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true, baseUrl: true, clientId: true },
    })

    if (args.list || instances.length === 0) {
      if (instances.length === 0) {
        console.log("No Canvas instances found. Create one in /admin first.")
      } else {
        console.log("Canvas instances:\n")
        for (const instance of instances) {
          console.log(`  id=${instance.id}  name="${instance.name}"  baseUrl=${instance.baseUrl}`)
        }
        console.log("")
      }

      if (args.list) {
        return
      }
    }

    let canvasInstanceId = args.canvasInstanceId

    if (!canvasInstanceId) {
      if (instances.length === 1) {
        canvasInstanceId = instances[0].id
        console.log(`Using only Canvas instance id=${canvasInstanceId} ("${instances[0].name}")\n`)
      } else {
        console.error("Multiple Canvas instances found. Pass --canvas-instance-id or run with --list")
        process.exit(1)
      }
    }

    const canvasInstance = instances.find((item) => item.id === canvasInstanceId)

    if (!canvasInstance) {
      console.error(`Canvas instance id=${canvasInstanceId} not found. Run with --list`)
      process.exit(1)
    }

    const redirectUri = `${args.toolkitUrl}${args.callbackPath}`
    const state = encodeState(canvasInstanceId, args.name, args.toolkitUrl, args.callbackPath)
    const authUrl = oauth2AuthLink(canvasInstance, state, redirectUri, {
      includeScopes: args.withScopes,
    })

    console.log("Admin export OAuth setup")
    console.log("========================")
    console.log(`Toolkit:              ${args.toolkitUrl}`)
    console.log(`Canvas instance:      id=${canvasInstance.id} (${canvasInstance.name})`)
    console.log(`Canvas base URL:      ${canvasInstance.baseUrl}`)
    console.log(`Export destination:   "${args.name}"`)
    console.log(`Redirect URI:         ${redirectUri}`)
    console.log(`OAuth scopes in URL:  ${args.withScopes ? "yes" : "no (default)"}`)
    console.log("")
    console.log("Before opening the link:")
    console.log(`  1. Ensure the app is running at ${args.toolkitUrl}`)
    console.log(`  2. Log in at ${args.toolkitUrl} in this browser`)
    console.log("  3. Approve access in Canvas when prompted")
    console.log("")
    console.log("Open this URL in your browser:\n")
    console.log(authUrl)
    console.log("")
    console.log("After success, a canvas-oauth2 export destination is created.")
    console.log('It should appear in the bundle "Export Bundle" dropdown.')
  } finally {
    await db.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
