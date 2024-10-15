export interface CanvasConfig {
  accessToken: string;
  baseUrl: string;
}

export enum EducationalUse {
  Activity = 'im:Activity',
  CheckYourReadiness = 'im:Assessment-pre',
  Cooldown = 'im:Cool-down',
  EndOfUnit = 'im:Assessment-end',
  Lesson = 'im:Lesson',
  PracticeProblems = 'im:PracticeProblemSet',
  Section = 'im:Section',
  Unit = 'im:Unit',
  WarmUp = 'im:Warm-up'
}

export class HttpError extends Error {
  description: string = '';
  readonly path: string;
  readonly status: number;

  constructor(
    description: string,
    message: string,
    path: string,
    status: number
  ) {
    super(message);

    this.description = description;
    this.name = this.constructor.name;
    this.path = path;
    this.status = status;
  }
}

export interface ParsedSitemap {
  content: any;
  urls: string[];
}
