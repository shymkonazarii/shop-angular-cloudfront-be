import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import * as path from "path";

export class ProductServiceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const getProductsListLambda = new lambda.Function(
            this,
            "getProductsListFunction",
            {
                runtime: lambda.Runtime.NODEJS_18_X,
                code: lambda.Code.fromAsset(path.join(__dirname, "lambda")),
                handler: "getProductsList.handler",
            }
        );

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

        const stockTable = new dynamodb.Table(this, "StockTable", {
            partitionKey: {
                name: "product_id",
                type: dynamodb.AttributeType.STRING,
            },
            tableName: "stock",
        });

        const lambdaEnvVariables = {
            PRODUCTS_TABLE_NAME: productsTable.tableName,
            STOCK_TABLE_NAME: stockTable.tableName,
        };
    }
}
