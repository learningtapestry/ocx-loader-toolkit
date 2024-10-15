import { parseStringPromise } from 'xml2js';
import { ParsedSitemap } from '../types';

async function parseSitemap(url: string): Promise<ParsedSitemap> {
  try {
    const response = await fetch(url);
    const xmlContent = await response.text();
    const parsedContent = await parseStringPromise(xmlContent);

    if (parsedContent.urlset?.url) {
      return {
        content: parsedContent,
        urls: parsedContent.urlset.url.map((u: any) => u.loc[0]) as string[]
      };
    } else {
      throw new Error('Invalid sitemap format');
    }
  } catch (error: any) {
    throw new Error(`Failed to fetch or parse sitemap: ${error.message}`);
  }
}

export default parseSitemap;
