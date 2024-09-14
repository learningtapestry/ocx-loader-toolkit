export type AssetData = {
  assetPath: string;
  blob: Blob;
}

export default abstract class QtiAssessmentItem {
  id: string;
  text: string;
  images: Blob[];

  protected constructor(id: string, text: string) {
    this.id = id;
    this.text = text;
    this.images = [];
  }

  abstract toXML(): string;
  abstract getAssets(): AssetData[];
}
