import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";

const client = new DynamoDBClient({
  region: "us-east-2",
});
const docClient = DynamoDBDocumentClient.from(client);

export const dynamodbAdapter = {
  async create(tableName: string, attributes: Record<string, any>) {
    const prefix = tableName.slice(0, 3).toLowerCase();
    const id = `${prefix}_${nanoid()}`;
    const itemWithId = { ...attributes, id };
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: itemWithId,
      }),
    );
    return itemWithId;
  },

  async findAll(tableName: string, params: Record<string, any> = {}) {
    const keyConditions = Object.entries(params)
      .map(([key, value]) => `#${key} = :${key}`)
      .join(" AND ");

    const expressionAttributeNames = Object.keys(params).reduce(
      (acc, key) => {
        acc[`#${key}`] = key;
        return acc;
      },
      {} as Record<string, string>,
    );

    const expressionAttributeValues = Object.entries(params).reduce(
      (acc, [key, value]) => {
        acc[`:${key}`] = value;
        return acc;
      },
      {} as Record<string, any>,
    );

    const result = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: keyConditions,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      }),
    );

    return result.Items || [];
  },

  async findById(tableName: string, id: string) {
    const result = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { id },
      }),
    );
    return result.Item;
  },

  async update(tableName: string, id: string, attributes: Record<string, any>) {
    const updateExpression = Object.keys(attributes)
      .map((key) => `#${key} = :${key}`)
      .join(", ");

    const expressionAttributeNames = Object.keys(attributes).reduce(
      (acc, key) => {
        acc[`#${key}`] = key;
        return acc;
      },
      {} as Record<string, string>,
    );

    const expressionAttributeValues = Object.entries(attributes).reduce(
      (acc, [key, value]) => {
        acc[`:${key}`] = value;
        return acc;
      },
      {} as Record<string, any>,
    );

    const result = await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression: `SET ${updateExpression}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      }),
    );

    return result.Attributes;
  },

  async destroy(tableName: string, id: string) {
    const result = await docClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { id },
        ReturnValues: "ALL_OLD",
      }),
    );
    return !!result.Attributes;
  },
};
