import OcxBundle from "./OcxBundle"

import { PrismaClient, BundleImportSource } from "@prisma/client"

import fetch from 'node-fetch';
import fetchCookie from 'fetch-cookie';
import computeHmacSignature from "./hmac/computeHmacSignature";
import db from "@/db";

import { JsonObject } from '@prisma/client/runtime/library';
import * as cheerio from 'cheerio';

import { DbClient } from "./db/DbClient";

const METADATA_SELECTOR = 'script[type="application/ld+json"]';

const createFetchWithCookies = () => fetchCookie(fetch);

export default class OpenSciEdLegacyOcxBundle extends OcxBundle {
  // legacy openscied doesn't create an xml sitemap, and a whole unit is
  // in one single .ocx.html file, where the data has some errors to fix

  normalizeUnitHtml(unitText: string): string {
    // all ids reference the fragments in the file itself
    unitText = unitText.replaceAll('"@id":"SCI', '"@id":"#SCI');

    // the html ids for Lesson and Unit have a prefix which we need to remove
    unitText = unitText.replaceAll('<div id="Lesson_', ',<div id="');
    unitText = unitText.replaceAll('<div id="Unit_', ',<div id="');

    return unitText;
  }

  validateUnitHtml(unitText: string): void {
    const normalized = this.normalizeUnitHtml(unitText);
    const $ = cheerio.load(normalized);
    const metadataHtml = $(METADATA_SELECTOR).first().html();

    if (!metadataHtml) {
      throw new Error("Invalid OCX HTML: missing application/ld+json metadata");
    }

    const metadata = JSON.parse(metadataHtml) as JsonObject | null;

    if (!metadata || typeof metadata !== "object" || !metadata["@type"]) {
      throw new Error("Invalid OCX HTML: metadata missing @type");
    }
  }

  async fetchUnitHtml(unitUrl: string): Promise<string> {
    if (unitUrl.includes("/api/")) {
      const response = await this.fetchUsingApi(unitUrl);

      if (!response.ok) {
        throw new Error(`LCMS returned ${response.status} ${response.statusText}`);
      }

      return response.text();
    }

    const fetchWithCookies = await this.logIntoOSELCMS(unitUrl);
    const response = await fetchWithCookies(unitUrl);

    if (!response.ok) {
      throw new Error(`LCMS returned ${response.status} ${response.statusText}`);
    }

    return response.text();
  }

  /** DB writes only — run inside a transaction. Fetch and validate before calling. */
  async importNodesFromUnitText(db: DbClient, unitText: string): Promise<void> {
    const normalized = this.normalizeUnitHtml(unitText);

    const filesTexts = {
      unitUrl: normalized,
    };

    const nodes = await this.createNodesFromFilesTexts(db, filesTexts);
    await this.splitPartNodes(db, nodes);
    await this.assignParentsToNodes(db, nodes);

    await this.reloadFromDb(db);

    // all nodes have a parent mismatch in legacy OSE OCX
    for (const node of this.ocxNodes) {
      if (node.parent !== node.isPartOf) {
        const parentNodeOcx = node.parent;
        if (parentNodeOcx) {
          await node.fixIsPartOf(db, parentNodeOcx);
        }
      }
    }

    await this.reloadFromDb(db);
  }

  async createNodesFromUnitHtml(db: PrismaClient, unitUrl: string) {
    const unitText = await this.fetchUnitHtml(unitUrl);
    this.validateUnitHtml(unitText);
    await this.importNodesFromUnitText(db, unitText);
    return this.prismaBundle;
  }

  async fetchUsingApi(unitUrl: string) {
    const parsedUrl = new URL(unitUrl);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
    const path = parsedUrl.pathname
    const timestamp = Math.floor(Date.now() / 1000)
    const body = ''

    const importSource = await db.bundleImportSource.findFirst({
      where: { baseUrl: { contains: baseUrl, mode: 'insensitive' } }
    }) as BundleImportSource;

    if (!importSource) {
      throw new Error("Import source not found");
    }

    const hmacSecret = (importSource.accessData as JsonObject).api_secret_key as string;

    const signature = computeHmacSignature(timestamp, path, body, hmacSecret);

    const response = await fetch(unitUrl, {
      method: 'GET',
      headers: {
        'X-Api-Timestamp': timestamp.toString(),
        'X-Api-Signature': signature,
      }
    });

    return response;
  }

  async logIntoOSELCMS(unitUrl: string) {
    const fetchWithCookies = createFetchWithCookies();

    const username = process.env.LEGACY_OSE_LCMS_USERNAME!;
    const password = process.env.LEGACY_OSE_LCMS_PASSWORD!;
    const baseUrl = unitUrl.split('/').slice(0, 3).join('/');
    const loginUrl = `${baseUrl}/users/sign_in`;

    const tokenResponse = await fetchWithCookies(loginUrl);
    const tokenHtml = await tokenResponse.text();

    const authenticityTokenMatch = tokenHtml.match(/authenticity_token" value="([^"]+)"/);
    if (!authenticityTokenMatch) {
      throw new Error("Authenticity token not found in HTML");
    }
    const authenticityToken = authenticityTokenMatch[1];

    const csrfTokenMatch = tokenHtml.match(/<meta name="csrf-token" content="([^"]+)"/);
    if (!csrfTokenMatch) {
      throw new Error("CSRF token not found in HTML");
    }
    const csrfToken = csrfTokenMatch[1];

    const loginResponse = await fetchWithCookies(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-CSRF-Token": csrfToken, // Add the CSRF token as a header
      },
      body: new URLSearchParams({
        "authenticity_token": authenticityToken,
        "user[email]": username,
        "user[password]": password,
      }),
    });

    if (!loginResponse.ok) {
      const text = await loginResponse.text();

      console.log(text);

      throw new Error("Login failed");
    }

    return fetchWithCookies;
  }
}
