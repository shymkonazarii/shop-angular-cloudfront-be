import { IProduct } from "../models/product.interface";
import { IStock } from "../models/stock.interface";

const AWS = require("aws-sdk");

AWS.config.update({ region: process.env.AWS_REGION });

const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async () => {
    try {
        const productsResult = await dynamoDb
            .scan({ TableName: process.env.PRODUCTS_TABLE_NAME })
            .promise();
        const products = productsResult.Items;

        // Fetch stock
        const stockResult = await dynamoDb
            .scan({ TableName: process.env.STOCK_TABLE_NAME })
            .promise();
        const stock = stockResult.Items;

        // Create joined response for FE
        const joinedProducts = products.map((product: IProduct) => {
            const stockItem =
                stock.find((s: IStock) => s.product_id === product.id) || {};
            return {
                id: product.id,
                title: product.title,
                description: product.description,
                price: product.price,
                count: stockItem.count || 0,
            };
        });

        return {
            statusCode: 200,
            body: JSON.stringify(joinedProducts),
        };
    } catch (error) {
        console.error("Error fetching products:", error);
        return {
            statusCode: 500,
            body: "Internal Server Error",
        };
    }
};
