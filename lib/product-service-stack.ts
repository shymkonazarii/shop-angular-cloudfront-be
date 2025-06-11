import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

export class ProductServiceStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Create the Lambda Function
        const getProductsListLambda = new lambda.Function(
            this,
            "getProductsListFunction",
            {
                runtime: lambda.Runtime.NODEJS_18_X,
                code: lambda.Code.fromAsset("lambda"), // Points to lambda directory
                handler: "getProductsList.handler", // file and function name
            }
        );

        // Create the API Gateway and integrate with Lambda
        const api = new apigateway.RestApi(this, "ProductServiceAPI", {
            restApiName: "Product Service",
            description: "API for product service.",
        });

        const productsResource = api.root.addResource("products");
        productsResource.addMethod(
            "GET",
            new apigateway.LambdaIntegration(getProductsListLambda)
        );

        const productsTable = new dynamodb.Table(this, "ProductsTable", {
            partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
            tableName: "products",
        });

        // Create Stock Table
        const stockTable = new dynamodb.Table(this, "StockTable", {
            partitionKey: {
                name: "product_id",
                type: dynamodb.AttributeType.STRING,
            },
            tableName: "stock",
        });

        // Environment variables for Lambda integration
        const lambdaEnvVariables = {
            PRODUCTS_TABLE_NAME: productsTable.tableName,
            STOCK_TABLE_NAME: stockTable.tableName,
        };
    }
}
