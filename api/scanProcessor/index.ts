import { AzureFunction, Context } from "@azure/functions";
import { scanBuffer } from "../shared/scanDll";
import { BlobServiceClient } from "@azure/storage-blob";
import { TableClient, AzureNamedKeyCredential } from "@azure/data-tables";

const scanProcessor: AzureFunction = async function (context: Context, message: string): Promise<void> {
    const fileName = Buffer.from(message, 'base64').toString('utf-8');

    const blobService = BlobServiceClient.fromConnectionString(process.env.STORAGE_CONN!);
    const container = blobService.getContainerClient('incoming');
    const blob = await container.getBlobClient(fileName).download();
    const buffer = await streamToBuffer(blob.readableStreamBody!);

    const isSafe = await scanBuffer(buffer);

    const target = isSafe ? 'clean' : 'quarantined';
    await blobService.getContainerClient(target).uploadBlockBlob(fileName, buffer, buffer.length);

    const tableClient = new TableClient(
        `https://${process.env.ACCOUNT_NAME}.table.core.windows.net`,
        'cvStatus',
        new AzureNamedKeyCredential(process.env.ACCOUNT_NAME!, process.env.ACCOUNT_KEY!)
    );

    await tableClient.upsertEntity({
        partitionKey: "cv",
        rowKey: fileName,
        status: isSafe ? "safe" : "unsafe",
        timestamp: new Date().toISOString()
    });

    await container.deleteBlob(fileName);
};

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks);
}

export default scanProcessor;
