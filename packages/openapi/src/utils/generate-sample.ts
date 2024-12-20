import { sample } from 'openapi-sampler';
import type { MethodInformation, RenderContext } from '@/types';
import {
  toSampleInput,
  getPreferredType,
  type ParsedSchema,
  type NoReference,
} from '@/utils/schema';
import { getSecurities, getSecurityPrefix } from '@/utils/get-security';

/**
 * Sample info of endpoint
 */
export interface EndpointSample {
  /**
   * Request URL, including path and query parameters
   */
  url: string;
  method: string;
  body?: {
    schema: ParsedSchema;
    mediaType: string;
    sample: unknown;
  };
  responses: Record<string, ResponseSample>;
  parameters: ParameterSample[];
}

interface ResponseSample {
  mediaType: string;
  sample: unknown;
  schema: ParsedSchema;
}

interface ParameterSample {
  name: string;
  in: string;
  schema: ParsedSchema;
  sample: unknown;
}

export function generateSample(
  path: string,
  method: MethodInformation,
  { baseUrl, document }: RenderContext,
): EndpointSample {
  const params: ParameterSample[] = [];
  const responses: EndpointSample['responses'] = {};

  for (const param of method.parameters ?? []) {
    if (param.schema) {
      params.push({
        name: param.name,
        in: param.in,
        schema: param.schema,
        sample: param.example ?? sample(param.schema as object),
      });
    } else if (param.content) {
      const key = getPreferredType(param.content);
      const content = key ? param.content[key] : undefined;

      if (!key || !content)
        throw new Error(
          `Cannot find parameter schema for ${param.name} in ${path} ${method.method}`,
        );

      params.push({
        name: param.name,
        in: param.in,
        schema: content.schema ?? {},
        sample:
          content.example ?? param.example ?? sample(content.schema as object),
      });
    }
  }

  const requirements = method.security ?? document.security;
  if (requirements && requirements.length > 0) {
    for (const security of getSecurities(requirements[0], document)) {
      const prefix = getSecurityPrefix(security);

      params.push({
        name: security.type === 'apiKey' ? security.name : 'Authorization',
        schema: {
          type: 'string',
        },
        sample: prefix ? `${prefix} <token>` : '<token>',
        in: 'header',
      });
    }
  }

  let bodyOutput: EndpointSample['body'];
  if (method.requestBody) {
    const body = method.requestBody.content;
    const type = getPreferredType(body);
    if (!type)
      throw new Error(
        `Cannot find body schema for ${path} ${method.method}: missing media type`,
      );
    const schema = (type ? body[type].schema : undefined) ?? {};

    bodyOutput = {
      schema,
      mediaType: type as string,
      sample: body[type].example ?? generateBody(method.method, schema),
    };
  }

  for (const [code, response] of Object.entries(method.responses ?? {})) {
    const content = response.content;
    if (!content) continue;

    const mediaType = getPreferredType(content) as string;
    if (!mediaType) continue;

    const responseSchema = content[mediaType].schema;
    if (!responseSchema) continue;

    responses[code] = {
      mediaType,
      sample:
        content[mediaType].example ??
        generateBody(method.method, responseSchema),
      schema: responseSchema,
    };
  }

  let pathWithParameters = path;
  const queryParams = new URLSearchParams();

  for (const param of params) {
    const value = generateBody(method.method, param.schema);
    if (param.in === 'query')
      queryParams.append(param.name, toSampleInput(value));

    if (param.in === 'path')
      pathWithParameters = pathWithParameters.replace(
        `{${param.name}}`,
        toSampleInput(value),
      );
  }

  if (queryParams.size > 0)
    pathWithParameters = `${pathWithParameters}?${queryParams.toString()}`;

  return {
    url: new URL(`${baseUrl}${pathWithParameters}`).toString(),
    body: bodyOutput,
    responses,
    method: method.method,
    parameters: params,
  };
}

function generateBody(
  method: string,
  schema: NoReference<ParsedSchema>,
): unknown {
  const value = sample(schema as object, {
    skipReadOnly: method !== 'GET',
    skipWriteOnly: method === 'GET',
  }) as Record<string, unknown>;

  fixGeneratedInput(value);

  return value;
}

// TODO: Check schema to confirm an empty object was generated from oneOf that included null
// Replaces generated empty objects {} with of nulls
function fixGeneratedInput(obj: Record<string, unknown>): void {
  for (const key in obj) {
    const value = obj[key];

    if (typeof value === 'object' && value !== null) {
      if (Object.keys(value).length === 0) {
        // Empty object
        obj[key] = null;
      } else {
        fixGeneratedInput(value as Record<string, unknown>);
      }
    }
  }
}
