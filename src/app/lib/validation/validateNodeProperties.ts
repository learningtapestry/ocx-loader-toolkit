import { Prisma } from "@prisma/client"
import Ajv from "ajv";
import addFormats from "ajv-formats";

import { PropertyValidationResult } from "../OcxNode";

import { JSONSchema7 } from 'json-schema';

import ocxNodeSchema from "./ocx_node.schema.json";
import activityJsonSchema from "./activity.schema.json";
import assessmentJsonSchema from "./assessment.schema.json";
import courseJsonSchema from "./course.schema.json";
import lessonJsonSchema from "./lesson.schema.json";
import moduleJsonSchema from "./module.schema.json";
import referencedMaterialJsonSchema from "./referenced_material.schema.json";
import supplementalMaterialJsonSchema from "./supplemental_material.schema.json";
import supportingMaterialJsonSchema from "./supporting_material.schema.json";
import unitJsonSchema from "./unit.schema.json";


const jsonSchemaByType: {[key: string]: JSONSchema7}  = {
  "ocx:Node": ocxNodeSchema as JSONSchema7,
  "oer:Activity": activityJsonSchema as JSONSchema7,
  "oer:Assessment": assessmentJsonSchema as JSONSchema7,
  "oer:Course": courseJsonSchema as JSONSchema7,
  "oer:Lesson": lessonJsonSchema as JSONSchema7,
  "oer:Module": moduleJsonSchema as JSONSchema7,
  "oer:ReferencedMaterial": referencedMaterialJsonSchema as JSONSchema7,
  "oer:SupplementalMaterial": supplementalMaterialJsonSchema as JSONSchema7,
  "oer:SupportingMaterial": supportingMaterialJsonSchema as JSONSchema7,
  "oer:Unit": unitJsonSchema as JSONSchema7
};

const jsonSchemaFileNameByType: {[key: string]: string} = {
  "ocx:Node": "ocx_node.schema.json",
  "oer:Activity": "activity.schema.json",
  "oer:Assessment": "assessment.schema.json",
  "oer:Course": "course.schema.json",
  "oer:Lesson": "lesson.schema.json",
  "oer:Module": "module.schema.json",
  "oer:ReferencedMaterial": "referenced_material.schema.json",
  "oer:SupplementalMaterial": "supplemental_material.schema.json",
  "oer:SupportingMaterial": "supporting_material.schema.json",
  "oer:Unit": "unit.schema.json"
}

const baseSchemaUrl = 'https://raw.githubusercontent.com/learningtapestry/ocx-loader-toolkit/main/src/app/lib/validation/';

export default function validateNodeProperties(properties: Prisma.JsonObject, nodeTypes: string[])  {
  const ret = {
    propertiesValidationResultsByProperty: {} as {[key: string]: PropertyValidationResult},
    missingProperties: [] as string[],
    nonStandardProperties: [] as string[],
    hasUnrecognizedType: false,
    jsonIsValid: false
  };

  const propertiesSchema =
    nodeTypes.map((type) => jsonSchemaByType[type]).find((schema) => !!schema);

  const propertiesSchemaFileName = nodeTypes.map((type) => jsonSchemaFileNameByType[type]).find((schema) => !!schema);

  if (!propertiesSchema) {
    ret.hasUnrecognizedType = true;

    return ret;
  }

  const ajv = new Ajv();
  // @ts-ignore
  addFormats(ajv);

  const currentNodeTypeSchemaUri = baseSchemaUrl+propertiesSchemaFileName;

  ajv.addSchema(ocxNodeSchema, baseSchemaUrl+'ocx_node.schema.json');
  ajv.addSchema(propertiesSchema, currentNodeTypeSchemaUri);

  const validate = ajv.getSchema(currentNodeTypeSchemaUri)!;

  ret.jsonIsValid = validate(properties) as boolean;

  const validationErrors = validate.errors;

  for (const propertyName in properties) {
    const propertyValidationSchema = propertiesSchema.properties![propertyName]
      || jsonSchemaByType['ocx:Node'].properties![propertyName];

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
      ...jsonSchemaByType['ocx:Node'],
      "$id": `${currentNodeTypeSchemaUri}#${propertyName}`,
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
