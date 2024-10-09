import { google, forms_v1 } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { googleApiKey } from "config/secrets";

export default class GoogleRepository {
  auth: GoogleAuth;

  constructor(apiKey?: any) {
    const credentials = (!apiKey || Object.keys(apiKey).length === 0) ? googleApiKey : apiKey;

    this.auth = new google.auth.GoogleAuth({
      credentials,
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

      if (
        mimeType === 'application/vnd.google-apps.document' ||
        mimeType === 'application/vnd.google-apps.presentation' ||
        mimeType === 'application/vnd.google-apps.spreadsheet'
      ) {
        return this.downloadWithExportLink(originalUrl);
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

  /**
   * Downloads a Google Drive file using its export link.
   * @param originalUrl The original Google Drive URL of the file.
   * @returns The downloaded file content along with its MIME type and extension.
   * @throws Will throw an error if the file cannot be downloaded.
   */
  async downloadWithExportLink(originalUrl: string): Promise<{ blob: Blob; mimeType: string; extension: string }> {
    const fileId = this.extractFileId(originalUrl);
    const drive = google.drive({
      version: 'v3',
      auth: this.auth,
    });

    try {
      // Fetch the file metadata, including export links
      const fileMetadata = await drive.files.get({
        fileId,
        fields: 'name, mimeType, exportLinks',
      });

      const mimeType = fileMetadata.data.mimeType;
      const name = fileMetadata.data.name;
      let exportMimeType: string;
      let extension: string;

      console.log(`downloadWithExportLink ${name} with MIME type ${mimeType}`);

      // Determine the export MIME type and file extension based on the original MIME type
      switch (mimeType) {
        case 'application/vnd.google-apps.document':
          exportMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          extension = 'docx';
          break;
        case 'application/vnd.google-apps.presentation':
          exportMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          extension = 'pptx';
          break;
        case 'application/vnd.google-apps.spreadsheet':
          exportMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          extension = 'xlsx';
          break;
        default:
          exportMimeType = 'application/pdf';
          extension = 'pdf';
      }

      const exportLink = fileMetadata.data.exportLinks![exportMimeType];

      if (!exportLink) {
        throw new Error(`Export link not found for MIME type ${exportMimeType}`);
      }

      const contentResponse = await fetch(exportLink!, {
        headers: {
          Authorization: `Bearer ${await this.auth.getAccessToken()}`,
        }
      });

      const blob = await contentResponse.blob();

      return {
        blob,
        mimeType: exportMimeType,
        extension,
      };
    } catch (e) {
      console.error('Error downloading with export link:', e);
      throw e;
    }
  }
}
