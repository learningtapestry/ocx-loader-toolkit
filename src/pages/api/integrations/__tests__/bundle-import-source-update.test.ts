import { testApiHandler } from "next-test-api-route-handler"

import { describe, it, expect, beforeEach, vi } from "vitest"
import { NextApiHandler } from "next"

import computeHmacSignature from "src/lib/hmac/computeHmacSignature"

import handler from "../bundle-import-source-update"
import { BundleImportSource } from "@prisma/client"
import db from "db"

describe("api/integrations/bundle-import-source-update", () => {
  const hmacSecret = "12345"

  let url: string
  const params = { bundleImportSourceId: "1" }

  let bundleImportSource: BundleImportSource

  beforeEach(async () => {
    process.env.HMAC_SECRET = hmacSecret

    await db.bundleImportSource.deleteMany()

    bundleImportSource = await db.bundleImportSource.create({
      data: {
        id: 1,
        name: "test",
        type: "lcms-legacy-ose",
        baseUrl: "https://example.com",
        accessData: {},
      },
    })

    url = `http://test.com/api/integrations/bundle-import-source-update?bundleImportSourceId=${bundleImportSource.id}`
  })

  describe("when the HMAC signature is invalid", () => {
    it("should return 401", async () => {
      await testApiHandler({
        pagesHandler: handler as NextApiHandler<any>,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url: "https://example.com/path/to/resource/123?foo=bar" }),
          })
          expect(res.status).toBe(401)
        },
        url,
        params,
      })
    })
  })

  describe("when the HMAC signature is valid", () => {
    // mock enqueueJob from import { enqueueJob } from "src/app/jobs/importBundleJob"
    // assert that it was called once
    beforeEach(() => {
      vi.mock("src/app/jobs/importBundleJob", () => ({
        enqueueJob: vi.fn(),
      }))
    })

    it("should return 200", async () => {
      await testApiHandler({
        pagesHandler: handler as NextApiHandler<any>,
        test: async ({ fetch }) => {
          const timestamp = Date.now().toString()
          const path = "/api/integrations/bundle-import-source-update"
          const body = JSON.stringify({
            url: "https://example.com/path/to/resource/123?foo=bar",
          })

          const computedSignature = computeHmacSignature(
            parseInt(timestamp),
            path,
            body,
            hmacSecret,
          )

          const res = await fetch({
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Hmac-Signature": computedSignature,
              "X-Timestamp": timestamp,
            },
            body,
          })
          expect(res.status).toBe(200)
        },
        url,
        params,
      })

      const { enqueueJob } = await import("src/app/jobs/importBundleJob")
      expect(enqueueJob).toHaveBeenCalledTimes(1)
    })
  })
})
