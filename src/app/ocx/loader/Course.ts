import absolutizeUrl from "./utils/absolutizeUrl";
import parseSitemap from "./utils/parseSitemap";
import randomUUID from "./utils/randomUUID";

import CourseNode from "./CourseNode";

import { EducationalUse, ParsedSitemap } from "./types";

const DEFAULT_COURSE_NAME = 'Untitled';

export default class Course {
  nodeUrlLookup: { [key: string]: CourseNode | null } = {};
  nodes: CourseNode[] = [];
  rootNodes: CourseNode[] = [];
  sitemap!: ParsedSitemap;
  readonly name: string;
  readonly sitemapUrl: string;

  constructor(name: string, sitemapUrl: string) {
    this.name = name || DEFAULT_COURSE_NAME;
    this.sitemapUrl = sitemapUrl;
  }

  get errorsCount() {
    return this.nodes.reduce(
      (accumulator, node) => accumulator + node.exportData.errors.length,
      0
    );
  }

  get id() {
    return this.unit.exportData.canvasId;
  }

  get unit() {
    return this.rootNodes[0];
  }

  get nodesWithErrors() {
    return this.nodes.filter(n => n.exportData.errors.length);
  }

  async loadData() {
    this.sitemap = await parseSitemap(this.sitemapUrl);

    this.nodeUrlLookup = Object.fromEntries(
      await Promise.all(this.sitemap.urls.map(async url => {
        const response = await fetch(absolutizeUrl(this.sitemapUrl, url));
        const html = await response.text();

        if (!response.ok) {
          console.log(url);
        }

        return [url, response.ok ? new CourseNode(html, url) : null];
      }))
    );

    // the nodes are all CourseNode objects which aren't "glossary" or "learning-targets"
    // TODO: why are we filtering through the url instead of some metadata??
    this.nodes = Object.values(this.nodeUrlLookup)
      .filter(Boolean)
      .filter(n => !n?.url.includes('glossary') && !n?.url.includes('learning-targets')) as CourseNode[];

    // builds the tree structure of our nodes
    // sets the root node as the unit
    this.buildNodesTrees();
  }

  reorganiseNodesIntoSections() {
    // organise the nodes into sections
    const checkYourReadinessSection = this.addSection(
      EducationalUse.CheckYourReadiness,
      this.unit.name
    );

    const endOfUnitSection = this.addSection(
      EducationalUse.EndOfUnit,
      'End of Unit'
    );

    const sections = this.unit
      .children
      .filter(n => n.educationalUse === EducationalUse.Section);

    // replaces the loaded children for the root node with the sections, thus reorganising the tree. It also ensures
    // that the order of the sections has checkYourReadinessSection at the beginning and endOfUnitSection at the end
    this.unit.children = [
      checkYourReadinessSection,
      ...sections,
      endOfUnitSection
    ].filter(Boolean) as CourseNode[];
  }

  // create a section composed of all nodes with the given educational use
  private addSection(educationalUse: EducationalUse, name: string) {
    const section = new CourseNode(`
      <!DOCTYPE html>
      <html lang=en>
        <script type=application/ld+json>
          {
            "alternateName": "${this.unit.alternateName}",
            "educationalUse": "im:Section",
            "identifier": "${randomUUID()}",
            "name": "${name}"
          }
        </script>
        <title>${this.unit.alternateName} ${name}</title>
      </html>`,
      ''
    );

    section.parent = this.unit;

    const nodes = this.nodes
      .filter(n => n.educationalUse === educationalUse)
      .map(n => {
        n.parent = section;
        return n;
      });

    if (nodes.length === 0) {
      return null;
    }

    section.children = nodes;
    return section;
  }

  // find the root nodes and assign a parent to all children nodes
  private buildNodesTrees() {
    const lookup: Record<string, CourseNode> = {};

    for (const node of this.nodes) {
      try {
        lookup[node.id] = node;
      } catch (e) {
        console.log('node', node.url);
      }
    }

    for (const node of this.nodes) {
      node.children = node.childIds.map(id => lookup[id]).filter(Boolean);
      node.parent = lookup[node.parentId];

      if (!node.parent) {
        this.rootNodes.push(node);
      }
    }
  }
}
