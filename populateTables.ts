import { config, DynamoDB } from "aws-sdk"; // Import AWS SDK
import * as dotenv from "dotenv"; // Import dotenv to handle environment variables
import { v4 as uuidv4 } from "uuid"; // Import the UUID library for unique product IDs

dotenv.config(); // Load environment variables from .env file

// DynamoDB configuration
config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const ddb = new DynamoDB.DocumentClient(); // Use DocumentClient for easy JSON handling

const productsTable = "products";
const stockTable = "stock";

// Mock data
const testProducts = [
    { title: "Laptop", description: "A high-end gaming laptop", price: 1500 },
    { title: "Phone", description: "A flagship smartphone", price: 700 },
    {
        title: "Headphones",
        description: "Noise-cancelling headphones",
        price: 200,
    },
    { title: "Monitor", description: "4K UHD Monitor", price: 300 },
];

const stockCounts = [50, 120, 30, 75]; // Test stock counts corresponding to products above

// Populate the DynamoDB tables with test data
const populateTables = async () => {
    console.log("Starting data insertion...");

    // Insert products
    const productIDs: string[] = [];
    for (const product of testProducts) {
        const id = uuidv4(); // Generate a unique ID for the product
        const productItem = {
            id,
            title: product.title,
            description: product.description,
            price: product.price,
        };

        try {
            await ddb
                .put({ TableName: productsTable, Item: productItem })
                .promise();
            console.log(`Inserted product: ${product.title} (ID: ${id})`);
            productIDs.push(id); // Store the ID for stock insertion later
        } catch (err) {
            console.error(`Error inserting product "${product.title}":`, err);
        }
    }

    // Insert stock counts
    for (let i = 0; i < productIDs.length; i++) {
        const stockItem = {
            product_id: productIDs[i],
            count: stockCounts[i],
        };

        try {
            await ddb.put({ TableName: stockTable, Item: stockItem }).promise();
            console.log(
                `Inserted stock for product ID: ${productIDs[i]} (Count: ${stockCounts[i]})`
            );
        } catch (err) {
            console.error(
                `Error inserting stock for product ID "${productIDs[i]}":`,
                err
            );
        }
    }

    console.log("Data insertion completed.");
};

// Execute the script if it's run directly
if (require.main === module) {
    populateTables()
        .then(() => console.log("Script finished successfully."))
        .catch((err) => console.error("Error occurred:", err));
}
