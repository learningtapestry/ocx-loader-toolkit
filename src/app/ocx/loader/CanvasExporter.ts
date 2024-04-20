import cheerio from 'cheerio';

import Course from './Course';
import CourseNode from './CourseNode';

import absolutizeUrl from './utils/absolutizeUrl';
import sleep from './utils/sleep';
import hexHtmlToString from './utils/hexHtmlToString';

import callCanvas from './repositories/callCanvas';

import { HttpError, EducationalUse, CanvasConfig } from './types';

export default class CanvasExporter {
  onNodeExported?: (node: CourseNode) => void;
  readonly canvasConfig: CanvasConfig;
  readonly course: Course;

  constructor(canvasConfig: CanvasConfig, course: Course) {
    this.canvasConfig = canvasConfig;
    this.course = course;
  }

  get courseUrl() {
    return new URL(`courses/${this.course.id}`, this.canvasConfig.baseUrl);
  }

  async export() {
    if (!this.course.nodes.length) {
      await this.course.loadData();
      this.course.reorganiseNodesIntoSections();
    }

    await this.exportNode(this.course.unit);
  }

  private async createOrUpdateResource(
    node: CourseNode,
    path: string,
    payload: any,
    resourceName = 'resource',
    method: 'POST' | 'PUT' = 'POST'
  ) {
    try {
      const resource = await callCanvas(
        this.canvasConfig.baseUrl,
        this.canvasConfig.accessToken,
        path,
        method,
        payload
      );

        if (resourceName === 'page') {
          console.log('page', resource);
        }

      if (!node.exportData.canvasId) {
        node.exportData.canvasId = resource.id;
      }

      if (!node.exportData.canvasUrl) {
        node.exportData.canvasUrl = resource.html_url;
      }

      return resource;
    } catch (e: any) {
      const error: HttpError = e;
      const action = method === 'POST' ? 'create' : 'update';
      error.description = `Failed to ${action} ${resourceName}`;
      node.exportData.errors.push(error);
      return null;
    }
  }

  private async exportNode(node: CourseNode, position?: number) {
    this.onNodeExported?.(node);

    try {
      switch (node.educationalUse) {
        case EducationalUse.Activity:
          await this.createAssignment(node, position);
          break;
        case EducationalUse.CheckYourReadiness:
        case EducationalUse.EndOfUnit:
        case EducationalUse.PracticeProblems:
          await this.createQuizFromQTI(node, position);
          break;
        case EducationalUse.Cooldown:
          await this.createQuiz(node, position);
          break;
        case EducationalUse.Lesson:
          await this.createModule(node, position);
          await this.createLessonSummaryPage(node);
          break;
        case EducationalUse.Section:
          await this.createModule(node, position);
          break;
        case EducationalUse.Unit:
          await this.createCourse(node);
          break;
        case EducationalUse.WarmUp:
          await this.createDiscussionTopic(node, position);
          break;
        default:
          console.log(`Unsupported educational use: ${node.educationalUse}`);
      }
    } catch (e: any) {
      console.log('global error', e);
      node.exportData.errors.push(e);
    }
  }

  private async createAssignment(node: CourseNode, position?: number) {
    console.log(`Create Assignment ${node.fullName} (${position})`);

    const { parent, root } = node;

    if (!parent) {
      console.log(`Node ${node.id} has no parent`);
      return;
    }

    if (!parent.exportData.canvasId) {
      console.log(`Node ${node.id} has no canvas ID`);
      return;
    }

    if (!root) {
      console.log(`Node ${node.id} has no root`);
      return;
    }

    if (!root.exportData.canvasId) {
      console.log(`Node ${node.id} has no canvas ID`);
      return;
    }

    // for (const file of node.files) {
    //   const fileId = await this.uploadFile(node, file.contentUrl);

    //   if (fileId) {
    //     const downloadUrl = `/files/${fileId}/download`;
    //     node.content.prepend(`<a href='${downloadUrl}'>${file.contentUrl}</a>`);
    //   }
    // }

    const assignmentData = {
      description: await this.replaceImages(node),
      name: hexHtmlToString(node.fullName),
      submission_types: node.submissionTypes
    }

    const assignment = await this.createOrUpdateResource(
      node,
      `courses/${root.exportData.canvasId}/assignments`,
      { assignment: assignmentData },
      'assignment'
    );

    // node.exportData.canvasId = assignment.id;

    if (!assignment) {
      return;
    }

    const itemData = {
      content_id: assignment.id,
      position,
      type: 'Assignment'
    };

    await this.createOrUpdateResource(
      node,
      `courses/${root.exportData.canvasId}/modules/${parent.exportData.canvasId}/items`,
      { module_item: itemData },
      'module item'
    );
  }

  private async createCourse(node: CourseNode) {
    const course = await this.createOrUpdateResource(
      node,
      'accounts/self/courses',
      { course: { name: this.course.name } },
      'course'
    );
    // node.exportData.canvasId = course.id;

    if (!course) {
      return;
    }

    this.course.unit.exportData.canvasUrl = this.courseUrl.toString();
    let position = 1;

    for (const child of node.children) {
      await this.exportNode(child, position);
      position += child.lessons.length + 1;
    }
  }

  private async createDiscussionTopic(node: CourseNode, position?: number) {
    console.log(`Create Discussion ${node.fullName} (${position})`);

    const { parent, root } = node;

    if (!parent) {
      console.log(`Node ${node.id} has no parent`);
      return;
    }

    if (!parent.exportData.canvasId) {
      console.log(`Node ${node.id} has no canvas ID`);
      return;
    }

    if (!root) {
      console.log(`Node ${node.id} has no root`);
      return;
    }

    if (!root.exportData.canvasId) {
      console.log(`Node ${node.id} has no canvas ID`);
      return;
    }

    const discussionTopicData = {
      discussion_type: 'side_comment',
      message: await this.replaceImages(node),
      title: hexHtmlToString(node.fullName)
    }

    const discussion = await this.createOrUpdateResource(
      node,
      `courses/${root.exportData.canvasId}/discussion_topics`,
      discussionTopicData,
      'discussion topic'
    );

    // node.exportData.canvasId = discussionTopic.id;
    if (!discussion) {
      return;
    }

    const itemData = {
      content_id: node.exportData.canvasId,
      position,
      type: 'Discussion'
    };

    await this.createOrUpdateResource(
      node,
      `courses/${root.exportData.canvasId}/modules/${parent.exportData.canvasId}/items`,
      { module_item: itemData },
      'module item'
    );
  }

  private async createLessonSummaryPage(node: CourseNode) {
    console.log(`Create Summary ${node.fullName} (${node.children.length + 1})`);

    const { root } = node;

    if (!node.exportData.canvasId) {
      console.log(`Node ${node.id} has no canvas ID`);
      return;
    }

    if (!root) {
      console.log(`Node ${node.id} has no root`);
      return;
    }

    if (!root.exportData.canvasId) {
      console.log(`Node ${node.id} has no canvas ID`);
      return;
    }

    const pageData = {
      body: await this.replaceImages(node),
      editing_roles: 'teachers',
      title: hexHtmlToString(`${node.alternateName} Lesson Summary`)
    }

    const page = await this.createOrUpdateResource(
      node,
      `courses/${root.exportData.canvasId}/pages`,
      { wiki_page: pageData },
      'page'
    );

    if (!page) {
      return;
    }

    const itemData = {
      page_url: page.url,
      position: node.children.length + 1,
      type: 'Page'
    };

    await this.createOrUpdateResource(
      node,
      `courses/${root.exportData.canvasId}/modules/${node.exportData.canvasId}/items`,
      { module_item: itemData },
      'module item'
    );
  }

  private async createModule(node: CourseNode, position?: number) {
    console.log(`Create Module ${node.fullName} (${position})`);

    const { root } = node;

    if (!root) {
      console.log(`Node ${node.id} has no root`);
      return;
    }

    if (!root.exportData.canvasId) {
      console.log(`Node ${node.id} has no canvas ID`);
      return;
    }

    const module = await this.createOrUpdateResource(
      node,
      `courses/${root.exportData.canvasId}/modules`,
      { module: { name: hexHtmlToString(node.fullName), position } },
      'module'
    );

    // node.exportData.canvasId = module.id;

    if (!module) {
      return;
    }

    if (position != module.position) {
      console.log(`Actual position: ${module.position}`);
    }

    let childPosition = node.educationalUse === EducationalUse.Section
      ? position! + 1
      : 1;

    for (const child of node.children) {
      await this.exportNode(child, childPosition);
      childPosition += 1;
    }
  }

  private async createQuiz(node: CourseNode, position?: number) {
    console.log(`Create Quiz ${node.fullName} (${position})`);

    const { parent, root } = node;

    if (!parent) {
      console.log(`Node ${node.id} has no parent`);
      return;
    }

    if (!parent.exportData.canvasId) {
      console.log(`Node ${node.id} has no canvas ID`);
      return;
    }

    if (!root) {
      console.log(`Node ${node.id} has no root`);
      return;
    }

    if (!root.exportData.canvasId) {
      console.log(`Node ${node.id} has no canvas ID`);
      return;
    }

    const quizData = {
      title: node.fullName,
      quiz_type: 'survey'
    };

    const quiz = await this.createOrUpdateResource(
      node,
      `courses/${root.exportData.canvasId}/quizzes`,
      { quiz: quizData },
      'quiz'
    );

    if (!quiz) {
      return;
    }

    const questionData = {
      question_text: node.content.html(),
      question_type: 'essay_question'
    };

    await this.createOrUpdateResource(
      node,
      `courses/${root.exportData.canvasId}/quizzes/${quiz.id}/questions`,
      { question: questionData },
      'quiz question'
    );

    const itemData = {
      content_id: node.exportData.canvasId,
      position,
      type: 'Quiz'
    };

    await this.createOrUpdateResource(
      node,
      `courses/${root.exportData.canvasId}/modules/${parent.exportData.canvasId}/items`,
      { module_item: itemData },
      'module item'
    );
  }

  private async createQuizFromQTI(node: CourseNode, position?: number) {
    console.log(`Create Quiz ${node.fullName} (${position})`);

    const { parent, root } = node;

    if (!parent) {
      console.log(`Node ${node.id} has no parent`);
      return;
    }

    if (!parent.exportData.canvasId) {
      console.log(`Node ${node.id} has no canvas ID`);
      return;
    }

    if (!root) {
      console.log(`Node ${node.id} has no root`);
      return;
    }

    if (!root.exportData.canvasId) {
      console.log(`Node ${node.id} has no canvas ID`);
      return;
    }

    const file = node
      .files
      .find((f: any) => f.encodingFormat === 'application/ims-qti+zip');

    if (!file) {
      node.exportData.errors.push(new Error(`Node ${node.id} has no QTI file`));
      return;
    }

    const payload = {
      migration_type: 'qti_converter',
      settings: {
        file_url: absolutizeUrl(this.course.sitemapUrl, file.contentUrl),
        insert_into_module_id: parent.exportData.canvasId,
        insert_into_module_type: 'quiz'
      }
    };

    const migration = await callCanvas(
      this.canvasConfig.baseUrl,
      this.canvasConfig.accessToken,
      `courses/${root.exportData.canvasId}/content_migrations`,
      'POST',
      payload
    );

    while (true) {
      const progress = await callCanvas(
        this.canvasConfig.baseUrl,
        this.canvasConfig.accessToken,
        migration.progress_url
      );

      if (progress.workflow_state === 'completed' || progress.workflow_state === 'failed') {
        break;
      }

      await sleep(1000);
    }

    const { audit_info: auditInfo } = await callCanvas(
      this.canvasConfig.baseUrl,
      this.canvasConfig.accessToken,
      `courses/${this.course.id}/content_migrations/${migration.id}`
    )

    const quizId = auditInfo['migration_settings']['imported_assets']['Quizzes::Quiz'];

    if (!quizId) {
      node.exportData.errors.push(new Error())
    }

    await this.createOrUpdateResource(
      node,
      `courses/${this.course.id}/quizzes/${quizId}`,
      { quiz: { title: node.fullName } },
      'quiz',
      'PUT'
    );
  }

  get updatedSitemap() {
    let sitemap = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:ocx="http://sitemap.ocx.org/v/1.0">\n`;

    for (const node of this.course.nodes.filter(n => n.exportData.canvasUrl)) {
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${node.exportData.canvasUrl}</loc>\n`;
      sitemap += `    <ocx:ocx>\n`;
      sitemap += `      <ocx:type>canvasURI</ocx:type>\n`;
      sitemap += `      <ocx:source-loc>${node.url}</ocx:source-loc>\n`;
      sitemap += `    </ocx:ocx>\n`;
      sitemap += `  </url>\n`;
    }

    return sitemap + `\n</urlset>`;
  }

  private async replaceImages(node: CourseNode) {
    return node.content.html();

    const $ = cheerio.load(node.content.toString());
    const promises: Promise<void>[] = [];

    $('img').each((_index, image) => {
      const $image = $(image);
      const src = $image.attr('src');

      if (!src || !/^https?:\/\//i.test(src)) {
        return;
      }

      const promise = (async () => {
        const response = await fetch(src);
        const blob = await response.blob();
        const buffer = Buffer.from(await blob.text());
        const contentType = response.headers.get('content-type') ?? 'image/*';
        const base64 = buffer.toString('base64');
        console.log('before', $image.attr('src'));
        $image.attr('src', `data:${contentType};base64,${base64}`);
        console.log('after', $image.attr('src'));
      })();

      promises.push(promise);
    })

    await Promise.all(promises);
    return $('body').html();
  }

  private async uploadFile(node: CourseNode, name: string) {
    const fileUrl = absolutizeUrl(this.course.sitemapUrl, name);
    const downloadResponse = await fetch(fileUrl);

    if (!downloadResponse.ok) {
      node.exportData.errors.push(
        new HttpError(
          'Failed to download file',
          downloadResponse.statusText,
          fileUrl,
          downloadResponse.status
        )
      );

      return null;
    }

    const blob = await downloadResponse.blob();

    const file = await this.createOrUpdateResource(
      node,
      `courses/${this.course.id}/files`,
      { name },
      'file'
    );

    if (!file) {
      return null;
    }

    const { upload_params: params, upload_url: uploadUrl } = file;
    const formData = new FormData();

    for (const param in params) {
      formData.append(param, params[param]);
    }

    formData.append('file', blob, name);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      node.exportData.errors.push({
        ...new HttpError(
          'Failed to upload file',
          uploadResponse.statusText,
          uploadUrl,
          uploadResponse.status)
      });

      return null;
    }

    return uploadResponse.url.match(/files\/(\d+)/)![1];
  }
}
