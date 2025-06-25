using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Net;
using System.Threading.Tasks;
using S_RiskAssesment;
using Newtonsoft.Json;

namespace api;

public class UploadCv
{
    private readonly ILogger<UploadCv> _logger;

    public UploadCv(ILogger<UploadCv> logger)
    {
        _logger = logger;
    }

    [Function("UploadCv")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequestData req)
    {
        _logger.LogInformation("UploadCv: rozpoczęcie przetwarzania pliku");

        if (!req.Headers.TryGetValues("Content-Type", out var contentTypes) ||
            !string.Join(";", contentTypes).Contains("application/pdf"))
        {
            var badRequest = req.CreateResponse(HttpStatusCode.BadRequest);
            await badRequest.WriteStringAsync("Niepoprawny typ pliku – oczekiwano application/pdf.");
            return badRequest;
        }

        using var memoryStream = new MemoryStream();
        await req.Body.CopyToAsync(memoryStream);
        var buffer = memoryStream.ToArray();

        if (buffer.Length == 0)
        {
            var badRequest = req.CreateResponse(HttpStatusCode.BadRequest);
            await badRequest.WriteStringAsync("Brak danych w przesłanym pliku.");
            return badRequest;
        }

        var storageConnectionString = Environment.GetEnvironmentVariable("STORAGE_CONNECTION_STRING");
        if (string.IsNullOrEmpty(storageConnectionString))
        {
            _logger.LogError("Brak STORAGE_CONNECTION_STRING w zmiennych środowiskowych.");
            var error = req.CreateResponse(HttpStatusCode.InternalServerError);
            await error.WriteStringAsync("Błąd serwera: brak konfiguracji połączenia z magazynem.");
            return error;
        }

        // 👇 Skanowanie PDF
        var result = await ScanPdfAsync(buffer, _logger);
        _logger.LogInformation("Wynik z .NET: {Result}", result.IsSafe);

        var containerName = result.IsSafe ? "safe-cv" : "unsafe-cv";
        var blobServiceClient = new BlobServiceClient(storageConnectionString);
        var containerClient = blobServiceClient.GetBlobContainerClient(containerName);
        await containerClient.CreateIfNotExistsAsync();

        var blobName = $"{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_uploaded.pdf";
        var blobClient = containerClient.GetBlobClient(blobName);

        using var uploadStream = new MemoryStream(buffer);
        await blobClient.UploadAsync(uploadStream, new BlobHttpHeaders { ContentType = "application/pdf" });

        var exists = await blobClient.ExistsAsync();
        if (exists)
        {
            _logger.LogInformation($"Plik {blobName} został zapisany.");
        }
        else
        {
            _logger.LogError($"Błąd zapisu pliku {blobName}.");
        }

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteStringAsync($"CV przesłane jako {blobName}");
        return response;
    }

private static async Task<ScanResult> ScanPdfAsync(byte[] fileBytes, ILogger logger)
{
    var licenseKey = "BDD3CBE2-4692-4E74-BF19-79444229343B";
    var riskAnalyzer = RiskAssessment.Create(licenseKey);

    await using var stream = new MemoryStream(fileBytes);
    var result = await riskAnalyzer.Scan(stream);

    // 👇 logowanie całego obiektu jako JSON
    logger.LogInformation("Skan PDF: {Result}", JsonConvert.SerializeObject(result));

    // Zakładamy, że wynik skanowania ma właściwość o innej nazwie, np. Safe lub Success.
    // Zmień 'IsSafe' na właściwą nazwę właściwości, np. 'Safe' lub 'Success'.
    bool isSafe = false;
    if (result != null)
    {
        // Przykład: jeśli właściwość nazywa się 'Safe'
        // isSafe = result.Safe;

        // Jeśli nie znasz właściwości, możesz spróbować dynamicznie:
        var resultType = result.GetType();
        var safeProp = resultType.GetProperty("IsSafe") ?? resultType.GetProperty("Safe") ?? resultType.GetProperty("Success");
        if (safeProp != null)
        {
            isSafe = (bool)(safeProp.GetValue(result) ?? false);
        }
    }

    return new ScanResult
    {
        IsSafe = isSafe,
        Details = JsonConvert.SerializeObject(result)
    };
}

    public class ScanResult
    {
        public bool IsSafe { get; set; }
        public string? Details { get; set; }
    }
}
