import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class ImportServiceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const importBucket = new s3.Bucket(this, "ImportBucket", {
            bucketName: "import-bucket-" + this.account,
            removalPolicy: cdk.RemovalPolicy.DESTROY, // Removes bucket when stack is torn down
            autoDeleteObjects: true,
            versioned: true,
        });

        const importProductsFile = new lambda.Function(
            this,
            "importProductsFileLambda",
            {
                runtime: lambda.Runtime.NODEJS_18_X,
                handler: "handler.main",
                code: lambda.Code.fromAsset("path/to/lambda-code-directory"), // Provide the directory with your Lambda code
                environment: {
                    BUCKET_NAME: importBucket.bucketName,
                },
            }
        );

        // Grant Lambda function permissions to access the S3 bucket
        importBucket.grantPut(importProductsFile);
        importBucket.grantRead(importProductsFile);

        const api = new apiGateway.RestApi(this, "ImportApi", {
            restApiName: "Import Service API",
        });

        const importResource = api.root.addResource("import");
        importResource.addMethod(
            "GET",
            new apiGateway.LambdaIntegration(importProductsFile),
            {
                requestParameters: {
                    "method.request.querystring.name": true, // Validate "name" parameter in request
                },
            }
        );

        new cdk.CfnOutput(this, "ImportBucketName", {
            value: importBucket.bucketName,
            description: "Name of the Import Service S3 Bucket",
        });
    }
}
