const AWS = require("aws-sdk");
import { S3Event } from "aws-lambda";
import { AWSError, S3, SQS } from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";
import * as csvParser from "csv-parser";
const sqs = new SQS();

const s3 = new AWS.S3();

const CATALOG_ITEMS_QUEUE_URL = process.env.CATALOG_ITEMS_QUEUE_URL || "";

exports.main = async (event: { queryStringParameters: { name: any } }) => {
    const BUCKET_NAME = process.env.BUCKET_NAME;

    const fileName = event.queryStringParameters?.name;
    if (!fileName) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing 'name' query parameter" }),
        };
    }

    const s3Key = `uploaded/${fileName}`;
    const signedUrlParams = {
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Expires: 60, // in 60 seconds
        ContentType: "text/csv",
    };

    try {
        const signedUrl = s3.getSignedUrl("putObject", signedUrlParams);
        return {
            statusCode: 200,
            body: JSON.stringify({ signedUrl }),
        };
    } catch (error) {
        console.error("Error generating Signed URL:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Could not generate Signed URL" }),
        };
    }
};

export const importFileParser = async (event: S3Event): Promise<void> => {
    const sendMessagePromises: Promise<
        PromiseResult<SQS.SendMessageResult, AWSError>
    >[] = [];

    for (const record of event.Records) {
        const s3Stream = s3
            .getObject({
                Bucket: record.s3.bucket.name,
                Key: record.s3.object.key,
            })
            .createReadStream();

        const csvRows: Record<string, any>[] = [];

        await new Promise((resolve, reject) => {
            s3Stream
                .pipe(csvParser.default())
                .on("data", (data: Record<string, any>) => csvRows.push(data))
                .on("end", resolve)
                .on("error", reject);
        });

        csvRows.forEach((row) => {
            const params: SQS.SendMessageRequest = {
                QueueUrl: CATALOG_ITEMS_QUEUE_URL,
                MessageBody: JSON.stringify(row),
            };
            sendMessagePromises.push(sqs.sendMessage(params).promise());
        });
    }

    await Promise.all(sendMessagePromises);

    console.log("All CSV records have been sent to SQS.");
};
