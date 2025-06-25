using System.IO;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace api;

public class CvScanner
{
    private readonly ILogger<CvScanner> _logger;

    public CvScanner(ILogger<CvScanner> logger)
    {
        _logger = logger;
    }

    [Function(nameof(CvScanner))]
    public async Task Run([BlobTrigger("samples-workitems/{name}", Connection = "")] Stream stream, string name)
    {
        using var blobStreamReader = new StreamReader(stream);
        var content = await blobStreamReader.ReadToEndAsync();
        _logger.LogInformation("C# Blob trigger function Processed blob\n Name: {name} \n Data: {content}", name, content);
    }
}