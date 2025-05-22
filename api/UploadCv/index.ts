import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
// scanProcessor -> muszę dopisać go

const uploadCv: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const file = req.body;

    if (!req.body || !req.headers["content-type"]?.includes("multipart/form-data")) {
        context.res = {
            status: 400,
            body: { error: "Plik PDF nie został przesłany." }
        };
        return;
    }

    const buffer = req.body;


    // const isSafe = await scanFileWithDll(buffer);
    // if (!isSafe) {
        context.res = {
            status: 400,
            body: { error: "Plik został uznany za niebezpieczny." }
        // };
        // return;
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.STORAGE_CONNECTION_STRING!);
    const containerClient = blobServiceClient.getContainerClient("safe-cv");

    const blobName = `${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: "application/pdf" },
    });

    context.res = {
        status: 200,
        body: { message: "CV przesłane i zapisane pomyślnie." }
    };
};

export default uploadCv;
