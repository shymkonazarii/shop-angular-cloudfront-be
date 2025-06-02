import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";

export class ImportServiceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Step 4: Define the S3 bucket
        const importBucket = new s3.Bucket(this, "ImportBucket", {
            bucketName: "import-bucket-" + this.account, // Ensure it is unique globally
            removalPolicy: cdk.RemovalPolicy.DESTROY, // Removes bucket when stack is torn down (use cautiously!)
            autoDeleteObjects: true, // Deletes all objects when bucket is destroyed
            versioned: true, // Enable versioning
        });

        // Add a "uploaded" folder structure in S3 (representing a logical path)
        // You don't need to create the folder explicitly in CDK. You can reference it when uploading files programmatically.

        // Output the bucket name for debugging purposes
        new cdk.CfnOutput(this, "ImportBucketName", {
            value: importBucket.bucketName,
            description: "Name of the Import Service S3 Bucket",
        });
    }
}
