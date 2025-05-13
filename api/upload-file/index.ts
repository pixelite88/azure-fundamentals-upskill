// /api/upload-file/index.ts
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuid } from "uuid";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const file = req.body;
    const fileName = req.query.filename || `cv-${uuid()}.pdf`;

    if (!file) {
        context.res = {
            status: 400,
            body: "Brak pliku w żądaniu"
        };
        return;
    }

    const AZURE_STORAGE_CONNECTION_STRING = process.env["AZURE_STORAGE_CONNECTION_STRING"];
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient("cv-uploads");
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    await blockBlobClient.upload(file, file.length, {
        blobHTTPHeaders: { blobContentType: "application/pdf" }
    });

    context.res = {
        status: 200,
        body: "Plik przesłany pomyślnie"
    };
};

export default httpTrigger;
