export type AssetData = {
  assetPath: string;
  blob: Blob;
}

export default abstract class QtiAssessmentItem {
  id: string;
  text: string;
  images: Blob[];
  questionImage: Promise<Blob | null>;

  protected constructor(id: string, text: string, image? : string | Blob) {
    this.id = id;
    this.text = text;
    this.images = [];

    if (typeof image === 'string') {
      this.questionImage = fetch(image).then(response => response.blob());
    } else if (image instanceof Blob) {
      this.questionImage = Promise.resolve(image);
    } else {
      this.questionImage = Promise.resolve(null);
    }
  }

  async questionImageUri(): Promise<string | null> {
    const blob = await this.questionImage;

    if (!blob) return null;

    const extension = blob.type.split('/')[1];

    return `assets/${this.id}_question.${extension}`;
  }

  async promptBody(): Promise<any> {
    const image = await this.questionImage;

    return {
      div: {
        div: this.text,
        ...(image && {
          img: {
            '@src': await this.questionImageUri()
          }
        })
      }
    };
  }

  abstract toXML(): Promise<string>;

  async getAssets(): Promise<AssetData[]> {
    const image = await this.questionImage;

    if (image) {
      return [{
        assetPath: `assets/${this.id}_question.${image.type.split('/')[1]}`,
        blob: image
      }];
    }

    return [];
  }
}
