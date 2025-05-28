import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import 'dotenv/config';

export async function UploadCv(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log("UploadCv: rozpoczęcie przetwarzania pliku");

    const contentType = request.headers.get("content-type") || "application/octet-stream";
    if (!contentType.includes("application/pdf")) {
        return {
            status: 400,
            body: "Niepoprawny typ pliku – oczekiwano application/pdf.",
        };
    }

    const buffer = Buffer.from(await request.arrayBuffer());
    if (!buffer || buffer.length === 0) {
        return {
            status: 400,
            body: "Brak danych w przesłanym pliku.",
        };
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient("safe-cv");

    const blobName = `${Date.now()}_uploaded.pdf`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: "application/pdf" },
    });

    const exists = await blockBlobClient.exists();
    if (exists) {
        context.log(`Plik ${blobName} został zapisany.`);
    } else {
        context.log(`Błąd zapisu pliku ${blobName}.`);
    }

    return {
        status: 200,
        body: `CV przesłane jako ${blobName}`,
    };
}

app.http("UploadCv", {
    methods: ["POST"],
    authLevel: "anonymous",
    handler: UploadCv,
});
