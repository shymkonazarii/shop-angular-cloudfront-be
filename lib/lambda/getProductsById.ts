const AWS = require("aws-sdk");

AWS.config.update({ region: process.env.AWS_REGION });

const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event: { pathParameters: { productId: string } }) => {
    try {
        const productId = event.pathParameters.productId;

        const productResult = await dynamoDb
            .get({
                TableName: process.env.PRODUCTS_TABLE_NAME,
                Key: { id: productId },
            })
            .promise();

        const stockResult = await dynamoDb
            .get({
                TableName: process.env.STOCK_TABLE_NAME,
                Key: { product_id: productId },
            })
            .promise();

        if (!productResult.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Product not found" }),
            };
        }

        const product = productResult.Item;
        const stockItem = stockResult.Item || {};

        const joinedProduct = {
            id: product.id,
            title: product.title,
            description: product.description,
            price: product.price,
            count: stockItem.count || 0,
        };

        return {
            statusCode: 200,
            body: JSON.stringify(joinedProduct),
        };
    } catch (error) {
        console.error("Error fetching product:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" }),
        };
    }
};
