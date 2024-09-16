import { google, forms_v1 } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { googleApiKey } from "@/config/secrets";

export default class GoogleRepository {
  auth: GoogleAuth;

  constructor() {
    this.auth = new google.auth.GoogleAuth({
      credentials: googleApiKey,
      scopes: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/forms.body.readonly'],
    });
  }


  extractFileId(originalUrl: string): string {
    const match = originalUrl.match(/\/d\/([^/?]+)|open\?id=([^/?&]+)/);
    if (match) {
      return match[1] || match[2];
    } else {
      throw new Error(`Could not extract file ID from URL: ${originalUrl}`);
    }
  }

  async downloadGoogleForm(originalUrl: string): Promise<forms_v1.Schema$Form> {
    const fileId = this.extractFileId(originalUrl);

    const forms = google.forms({
      version: 'v1',
      auth: this.auth,
    });

    try {
      const res = await forms.forms.get({ formId: fileId });
      return res.data;
    } catch (e) {
      console.error('Error downloading form:', e);
      throw e;
    }
  }

  async downloadFromGoogleDrive(originalUrl: string) {
    const fileId = this.extractFileId(originalUrl);

    const drive = google.drive({
      version: 'v3',
      auth: this.auth,
    });

    try {
      // Fetch the file metadata to get the file name and mime type
      const metadataResponse = await drive.files.get({
        fileId,
        fields: 'name, mimeType',
      });

      const fileName = metadataResponse.data.name;
      const mimeType = metadataResponse.data.mimeType;

      if (mimeType === 'application/vnd.google-apps.document') {
        const exportResponse = await drive.files.export(
          { fileId, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
          { responseType: 'arraybuffer' }
        );

        const arrayBuffer = exportResponse.data;
        const blob = new Blob([arrayBuffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

        return {
          blob,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          extension: 'docx'
        };
      } else {
        const contentResponse = await drive.files.get(
          { fileId, alt: 'media' },
          { responseType: 'arraybuffer' }
        );

        const arrayBuffer = contentResponse.data;
        const blob = new Blob([arrayBuffer as BlobPart], { type: mimeType as string });

        return {
          blob,
          mimeType,
          extension: mimeType?.split('/')[1] || 'pdf'
        };
      }
    } catch (e) {
      console.error('Error downloading file', e);
      throw e;
    }
  }
}
