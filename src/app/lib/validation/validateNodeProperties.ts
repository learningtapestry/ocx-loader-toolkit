import { Prisma } from "@prisma/client"
import Ajv from "ajv";
import addFormats from "ajv-formats";

import { PropertyValidationResult } from "../OcxNode";

import { JSONSchema7 } from 'json-schema';

import activityJsonSchemaImport from "./activity.schema.json";

const activityJsonSchema = activityJsonSchemaImport as JSONSchema7;

const jsonSchemaByType: {[key: string]: JSONSchema7}  = {
  "oer:Activity": activityJsonSchema
};

export default function validateNodeProperties(properties: Prisma.JsonObject, nodeTypes: string[])  {
  const ret = {
    propertiesValidationResultsByProperty: {} as {[key: string]: PropertyValidationResult},
    missingProperties: [] as string[],
    nonStandardProperties: [] as string[],
    hasUnrecognizedType: false,
    jsonIsValid: false
  };

  const propertiesSchema = nodeTypes.map((type) => jsonSchemaByType[type]).find((schema) => !!schema);

  if (!propertiesSchema) {
    ret.hasUnrecognizedType = true;

    return ret;
  }

  const ajv = new Ajv();
  // @ts-ignore
  addFormats(ajv);
  const validate = ajv.compile(propertiesSchema);

  ret.jsonIsValid = validate(properties);

  const validationErrors = validate.errors;

  for (const propertyName in properties) {
    const propertyValidationSchema = propertiesSchema.properties![propertyName];

    if (!propertyValidationSchema) {
      ret.nonStandardProperties.push(propertyName);

      ret.propertiesValidationResultsByProperty[propertyName] = {
        propertyName,
        isRecognizedProperty: false,
        isValid: false,
        validationErrors: []
      };
      continue;
    }

    const propertyValidate = ajv.compile({
      ...propertiesSchema,
      properties: {
        [propertyName]: propertyValidationSchema
      },
      required: [propertyName]
    });

    const isValueValid = propertyValidate(properties);
    ret.propertiesValidationResultsByProperty[propertyName] = {
      propertyName,
      isRecognizedProperty: true,
      isValid: isValueValid,
      validationErrors: propertyValidate.errors || []
    };
  }

  // TODO find missing properties

  return ret;
}
