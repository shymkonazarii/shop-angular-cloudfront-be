const AWS = require("aws-sdk");

const s3 = new AWS.S3();

exports.main = async (event: { queryStringParameters: { name: any } }) => {
    const BUCKET_NAME = process.env.BUCKET_NAME;

    // Parse the file name from query parameters
    const fileName = event.queryStringParameters?.name;
    if (!fileName) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing 'name' query parameter" }),
        };
    }

    // Define the S3 key and parameters for the Signed URL
    const s3Key = `uploaded/${fileName}`;
    const signedUrlParams = {
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Expires: 60, // in 60 seconds
        ContentType: "text/csv",
    };

    try {
        // Generate the Signed URL
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
