import type { AWS } from "@serverless/typescript";

const serverlessConfiguration: AWS = {
    service: "product-service",
    frameworkVersion: "3",
    plugins: ["serverless-esbuild"],
    provider: {
        name: "aws",
        runtime: "nodejs18.x",
        region: "us-east-1",
        stage: "dev",
        environment: {
            PRODUCTS_TABLE: "products",
            CATALOG_ITEMS_QUEUE_URL: {
                "Fn::GetAtt": ["CatalogItemsQueue", "QueueName"],
            },
            CREATE_PRODUCT_TOPIC_ARN: {
                Ref: "CreateProductTopic",
            },
        },
        iamRoleStatements: [
            {
                Effect: "Allow",
                Action: [
                    "dynamodb:PutItem",
                    "dynamodb:BatchWriteItem",
                    "dynamodb:Scan",
                    "dynamodb:GetItem",
                ],
                Resource: "arn:aws:dynamodb:us-east-1:*:table/products",
            },
            {
                Effect: "Allow",
                Action: [
                    "sqs:SendMessage",
                    "sqs:ReceiveMessage",
                    "sqs:DeleteMessage",
                ],
                Resource: { "Fn::GetAtt": ["CatalogItemsQueue", "Arn"] },
            },
            {
                Effect: "Allow",
                Action: ["sns:Publish"],
                Resource: { Ref: "CreateProductTopic" },
            },
        ],
    },
    functions: {
        catalogBatchProcess: {
            handler: "src/handler.catalogBatchProcess",
            environment: {
                CREATE_PRODUCT_TOPIC_ARN: {
                    Ref: "CreateProductTopic",
                },
            },
            events: [
                {
                    sqs: {
                        arn: { "Fn::GetAtt": ["CatalogItemsQueue", "Arn"] },
                        batchSize: 5,
                    },
                },
            ],
        },
        importFileParser: {
            handler: "src/handler.importFileParser",
            environment: {
                CATALOG_ITEMS_QUEUE_URL: {
                    "Fn::GetAtt": ["CatalogItemsQueue", "QueueName"],
                },
            },
            events: [
                {
                    s3: {
                        bucket: process.env.BUCKET_NAME || "",
                        event: "s3:ObjectCreated:*",
                        existing: true,
                    },
                },
            ],
        },
    },
    resources: {
        Resources: {
            CatalogItemsQueue: {
                Type: "AWS::SQS::Queue",
                Properties: {
                    QueueName: "catalogItemsQueue",
                },
            },
            CreateProductTopic: {
                Type: "AWS::SNS::Topic",
                Properties: {
                    TopicName: "createProductTopic",
                },
            },
            CreateProductTopicSubscription: {
                Type: "AWS::SNS::Subscription",
                Properties: {
                    TopicArn: { Ref: "CreateProductTopic" },
                    Protocol: "email",
                    Endpoint: process.env.EMAIL,
                },
            },
            ProductsTable: {
                Type: "AWS::DynamoDB::Table",
                Properties: {
                    TableName: "ProductsTable",
                    AttributeDefinitions: [
                        { AttributeName: "id", AttributeType: "S" },
                    ],
                    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
                    BillingMode: "PAY_PER_REQUEST",
                },
            },
        },
    },
    package: {
        individually: true,
    },
    custom: {
        productsTable: "ProductsTable",
    },
};

export default serverlessConfiguration;
