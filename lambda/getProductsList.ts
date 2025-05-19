export const handler = async (): Promise<any> => {
    const products = [
        { id: "1", name: "Product A", price: 10.99 },
        { id: "2", name: "Product B", price: 20.99 },
        { id: "3", name: "Product C", price: 30.99 },
    ];

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(products),
    };
};
