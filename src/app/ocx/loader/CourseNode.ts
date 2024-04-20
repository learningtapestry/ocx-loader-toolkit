import cheerio from 'cheerio';

import { EducationalUse } from './types';

const METADATA_SELECTOR = 'script[type="application/ld+json"]';

const SUBMISSION_TYPES: Record<string, string> = {
  'None': 'none',
  'Text': 'online_text_entry',
  'URL': 'online_url',
  'File Upload': 'online_upload',
  // 'Recording': 'media_recording',
  'External Tool': 'external_tool',
  // 'Student Annotation': 'student_annotation',
  'Discussion': 'discussion_topic',
  'Oral Response': 'none'
}

interface ExportData {
  exported: Boolean;
  errors: Error[];
}

interface CanvasExportData extends ExportData {
  canvasId?: number;
  canvasUrl?: string;
}

export default class CourseNode {
  parent: CourseNode | null = null;
  children: CourseNode[] = [];

  exportData: CanvasExportData = {
    exported: false,
    errors: []
  };

  private _root: CourseNode | null = null;
  readonly content: cheerio.Cheerio;
  readonly metadata: any;
  readonly url: string;

  constructor(html: string, url: string) {
    const $ = cheerio.load(html);
    this.content = $('body').first();
    this.metadata = JSON.parse($(METADATA_SELECTOR).first().html()!);
    this.url = url;
  }

  get alternateName() {
    return this.metadata.alternateName;
  }

  get childIds() {
    return (this.metadata.hasPart ?? []).map((n: any) => n['@id']) as string[];
  }

  get educationalUse() {
    return this.metadata.educationalUse as EducationalUse;
  }

  get files() {
    return this.metadata.encoding;
  }

  get id() {
    return this.metadata.identifier;
  }

  get fullName() {
    let { name } = this;

    if (this.educationalUse === EducationalUse.Cooldown) {
      name = `Cool-down ${name}`;
    }

    return `${this.alternateName} ${name}`;
  }

  get lessons() {
    return this.children.filter(c => c.educationalUse === EducationalUse.Lesson);
  }

  get name() {
    return this.metadata.name;
  }

  get parentId() {
    return this.metadata.isPartOf['@id'];
  }

  get root(): CourseNode | null {
    if (this._root) {
      return this._root;
    }

    this._root = this.parent;
    const parents = new Set([this._root]);

    while (this._root?.parent) {
      this._root = this._root.parent;

      if (parents.has(this._root)) {
        throw new Error(
          `Node ${this.id} has a circular ref among its ancestors: ${this._root.id}`
        );
      }

      parents.add(this._root);
    }

    return this._root;
  }

  get submissionTypes() {
    return this
      .metadata['ocx:submissionType']
      .split(',')
      .map((t: string) => SUBMISSION_TYPES[t.trim()])
      .filter(Boolean);
  }

  get type() {
    return this.metadata['@type'];
  }
}
