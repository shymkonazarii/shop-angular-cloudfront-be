import { DynamoDB, SNS } from "aws-sdk";
import { SQSEvent } from "aws-lambda";

const dynamoDb = new DynamoDB.DocumentClient();
const sns = new SNS();

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || "";
const CREATE_PRODUCT_TOPIC_ARN = process.env.CREATE_PRODUCT_TOPIC_ARN || "";

export const catalogBatchProcess = async (event: SQSEvent): Promise<void> => {
    console.log("Received SQS event:", JSON.stringify(event));

    const productPromises = event.Records.map(async (record) => {
        const product = JSON.parse(record.body);

        const params = {
            TableName: PRODUCTS_TABLE,
            Item: {
                id: product.id,
                title: product.title,
                description: product.description,
                price: product.price,
                count: product.count,
            },
        };

        await dynamoDb.put(params).promise();
    });

    await Promise.all(productPromises);

    const snsParams: SNS.PublishInput = {
        TopicArn: CREATE_PRODUCT_TOPIC_ARN,
        Message: "New products have been created successfully.",
    };

    await sns.publish(snsParams).promise();

    console.log("SNS notification sent for new product creation.");
};
