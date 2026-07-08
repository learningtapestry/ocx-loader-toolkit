import { forms_v1 } from "googleapis"

import callGoogleApi from "../repositories/callGoogleApi"
import { extractGoogleFileId } from "./attachmentHelpers"

const GOOGLE_FORMS_API_BASE = "https://forms.googleapis.com/v1"
const GOOGLE_DRIVE_API_BASE = "https://www.googleapis.com/drive/v3"

type FormItem = forms_v1.Schema$Item

function stripItemForCreate(item: FormItem): FormItem {
  const cloned = structuredClone(item) as FormItem & {
    itemId?: string
    questionItem?: { question?: { questionId?: string } }
  }

  delete cloned.itemId

  if (cloned.questionItem?.question) {
    delete cloned.questionItem.question.questionId
  }

  return cloned
}

export async function recreateFormInFolder(
  accessToken: string,
  formSourceUrl: string,
  folderId: string,
): Promise<{ id: string }> {
  const sourceFormId = extractGoogleFileId(formSourceUrl)
  if (!sourceFormId) {
    throw new Error(`Could not extract form ID from URL: ${formSourceUrl}`)
  }

  const sourceForm = (await callGoogleApi(
    accessToken,
    GOOGLE_FORMS_API_BASE,
    `forms/${sourceFormId}`,
  )) as forms_v1.Schema$Form

  const title = sourceForm.info?.title || sourceForm.info?.documentTitle || "Copied Form"

  const createdForm = (await callGoogleApi(
    accessToken,
    GOOGLE_FORMS_API_BASE,
    "forms",
    "POST",
    {
      info: {
        title,
        documentTitle: sourceForm.info?.documentTitle || title,
      },
    },
  )) as forms_v1.Schema$Form

  const formId = createdForm.formId
  if (!formId) {
    throw new Error("Google Forms API did not return a form id")
  }

  const items = sourceForm.items || []
  if (items.length > 0) {
    const requests = items.map((item, index) => ({
      createItem: {
        item: stripItemForCreate(item),
        location: { index },
      },
    }))

    await callGoogleApi(
      accessToken,
      GOOGLE_FORMS_API_BASE,
      `forms/${formId}:batchUpdate`,
      "POST",
      { requests },
    )
  }

  await callGoogleApi(
    accessToken,
    GOOGLE_DRIVE_API_BASE,
    `files/${formId}?addParents=${encodeURIComponent(folderId)}&fields=id`,
    "PATCH",
  )

  return { id: formId }
}
