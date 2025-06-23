import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as dotenv from "dotenv";

dotenv.config();

export const basicAuthorizer = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    console.log("Event:", event);

    const authHeader = event.headers?.Authorization;

    if (!authHeader) {
        return {
            statusCode: 401,
            body: JSON.stringify({
                message: "Authorization header is missing",
            }),
        };
    }

    try {
        const token = authHeader.split(" ")[1];
        const decodedCredentials = Buffer.from(token, "base64").toString(
            "utf-8"
        );

        const [username, password] = decodedCredentials.split(":");
        if (!username || !password) {
            throw new Error("Invalid credentials format");
        }

        const validPassword = process.env[username];

        if (!validPassword || validPassword !== password) {
            return {
                statusCode: 403,
                body: JSON.stringify({
                    message: "Access denied: Invalid credentials",
                }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Access granted" }),
        };
    } catch (err) {
        console.error("Error during authorization:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};
