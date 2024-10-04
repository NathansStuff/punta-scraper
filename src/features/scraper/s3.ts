import AWS from 'aws-sdk';
import fs from 'fs';

const s3 = new AWS.S3({
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    region: process.env.AWS_REGION,
});

const bucketName = 'puntaai-scraping'; // Replace with your actual S3 bucket name

export async function uploadToS3(filePath: string, key: string): Promise<void> {
    const fileContent = fs.readFileSync(filePath);

    const params = {
        Bucket: bucketName,
        Key: key,
        Body: fileContent,
        ContentType: 'image/png', // Set the content type
    };

    try {
        await s3.upload(params).promise();
        console.log(`Successfully uploaded ${key} to S3`);
    } catch (error) {
        console.error('Error uploading file to S3:', error);
        throw error;
    }
}

// Delete file locally
export function deleteLocalFile(filePath: string): void {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Error deleting file:', err);
        } else {
            console.log(`${filePath} was deleted locally`);
        }
    });
}
