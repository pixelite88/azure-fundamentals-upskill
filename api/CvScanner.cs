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

        try
        {
            // Weryfikacja typu pliku
            if (!req.Headers.TryGetValues("Content-Type", out var contentTypes) ||
                !string.Join(";", contentTypes).Contains("application/pdf"))
            {
                var badRequest = req.CreateResponse(HttpStatusCode.BadRequest);
                badRequest.Headers.Add("Content-Type", "text/plain; charset=utf-8");
                await badRequest.WriteStringAsync("Niepoprawny typ pliku – oczekiwano application/pdf.");
                return badRequest;
            }

            // Wczytanie pliku do bufora
            using var memoryStream = new MemoryStream();
            await req.Body.CopyToAsync(memoryStream);
            var buffer = memoryStream.ToArray();

            if (buffer.Length == 0)
            {
                var badRequest = req.CreateResponse(HttpStatusCode.BadRequest);
                badRequest.Headers.Add("Content-Type", "text/plain; charset=utf-8");
                await badRequest.WriteStringAsync("Brak danych w przesłanym pliku.");
                return badRequest;
            }

            // Pobranie connection stringa
            var storageConnectionString = Environment.GetEnvironmentVariable("STORAGE_CONNECTION_STRING");
            if (string.IsNullOrEmpty(storageConnectionString))
            {
                _logger.LogError("Brak STORAGE_CONNECTION_STRING w zmiennych środowiskowych.");
                var error = req.CreateResponse(HttpStatusCode.InternalServerError);
                error.Headers.Add("Content-Type", "text/plain; charset=utf-8");
                await error.WriteStringAsync("Błąd serwera: brak konfiguracji połączenia z magazynem.");
                return error;
            }

            ScanResult result;
            try
            {
                result = await ScanPdfAsync(buffer, _logger);
                _logger.LogInformation("Wynik skanowania z .NET: IsSafe={Result}", result.IsSafe);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Błąd podczas skanowania PDF.");
                var error = req.CreateResponse(HttpStatusCode.InternalServerError);
                error.Headers.Add("Content-Type", "text/plain; charset=utf-8");
                await error.WriteStringAsync("Błąd serwera: nie udało się przeskanować pliku PDF.");
                return error;
            }

            var containerName = result.IsSafe ? "safe-cv" : "unsafe-cv";

            try
            {
                var blobServiceClient = new BlobServiceClient(storageConnectionString);
                var containerClient = blobServiceClient.GetBlobContainerClient(containerName);
                await containerClient.CreateIfNotExistsAsync();

                var blobName = $"{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_uploaded.pdf";
                var blobClient = containerClient.GetBlobClient(blobName);

                using var uploadStream = new MemoryStream(buffer);
                await blobClient.UploadAsync(uploadStream, new BlobHttpHeaders { ContentType = "application/pdf" });

                if (await blobClient.ExistsAsync())
                {
                    _logger.LogInformation($"Plik {blobName} został zapisany w kontenerze {containerName}.");
                }
                else
                {
                    _logger.LogWarning($"Blob {blobName} nie istnieje po zapisie.");
                }

                var response = req.CreateResponse(HttpStatusCode.OK);
                response.Headers.Add("Content-Type", "text/plain; charset=utf-8");
                await response.WriteStringAsync($"CV przesłane jako {blobName}");
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Błąd przy zapisie do Azure Blob Storage.");
                var error = req.CreateResponse(HttpStatusCode.InternalServerError);
                error.Headers.Add("Content-Type", "text/plain; charset=utf-8");
                await error.WriteStringAsync("Błąd serwera: nie udało się zapisać pliku do Azure Blob Storage.");
                return error;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Nieoczekiwany błąd UploadCv.");
            var error = req.CreateResponse(HttpStatusCode.InternalServerError);
            error.Headers.Add("Content-Type", "text/plain; charset=utf-8");
            await error.WriteStringAsync("Nieoczekiwany błąd serwera.");
            return error;
        }
    }

    private static async Task<ScanResult> ScanPdfAsync(byte[] fileBytes, ILogger logger)
    {
        try
        {
            var licenseKey = "BDD3CBE2-4692-4E74-BF19-79444229343B";
            var riskAnalyzer = RiskAssessment.Create(licenseKey);

            await using var stream = new MemoryStream(fileBytes);
            var result = await riskAnalyzer.Scan(stream);

            logger.LogInformation("Skan PDF: {Result}", JsonConvert.SerializeObject(result));

            bool isSafe = false;
            if (result != null)
            {
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
        catch (Exception ex)
        {
            logger.LogError(ex, "Błąd podczas działania ScanPdfAsync.");
            throw; // niech leci dalej
        }
    }

    public class ScanResult
    {
        public bool IsSafe { get; set; }
        public string? Details { get; set; }
    }
}
