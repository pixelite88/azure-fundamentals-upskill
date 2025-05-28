import {app, HttpRequest, HttpResponseInit, InvocationContext} from "@azure/functions";
import {BlobServiceClient} from "@azure/storage-blob";

// scanProcessor -> muszę dopisać go


export async function UploadCv(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const file = request.body;
    console.log(file);

    if (!request.body || !request.headers["content-type"]?.includes("multipart/form-data")) {
        return {
            status: 400,
            body: "Plik PDF nie został przesłany."
        };
    }

    const buffer = request.body;

    // const isSafe = await scanFileWithDll(buffer);
    // if (!isSafe) {
    // context.res = {
    //     status: 400,
    //     body: { error: "Plik został uznany za niebezpieczny." }
    //     };
    //     return;
    // }

    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.STORAGE_CONNECTION_STRING!);
    const containerClient = blobServiceClient.getContainerClient("safe-cv");

    const blobName = `${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // @ts-ignore
    await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {blobContentType: "application/pdf"},
    });

    return {
        status: 200,
        body: "CV przesłane i zapisane pomyślnie."
    }
}

app.http('UploadCv', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: UploadCv
});



