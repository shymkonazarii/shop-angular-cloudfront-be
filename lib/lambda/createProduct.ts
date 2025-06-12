import { DynamoDB } from "aws-sdk";
import { APIGatewayProxyHandler } from "aws-lambda";

const dynamoDb = new DynamoDB.DocumentClient();
const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || "";

export const handler: APIGatewayProxyHandler = async (event: { body: any }) => {
    try {
        const { id, title, description, price } = JSON.parse(
            event.body || "{}"
        );

        if (!id || !title || !description || !price) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: "id, title, description, and price are required",
                }),
            };
        }

        const productItem = {
            title: title,
            description: description,
            price: price,
        };

        await dynamoDb
            .put({
                TableName: PRODUCTS_TABLE_NAME,
                Item: productItem,
            })
            .promise();

        return {
            statusCode: 201,
            body: JSON.stringify(productItem),
        };
    } catch (error) {
        console.error("Error creating product:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error", error }),
        };
    }
};
