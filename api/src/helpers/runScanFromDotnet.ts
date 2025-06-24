import * as edge from 'edge-js';
import * as path from 'path';

const dllPath = path.resolve(__dirname, './libs/S_RiskAssessment.dll');

const scanPdf = edge.func({
    assemblyFile: dllPath,
    typeName: 'S_RiskAssesment.RiskAssessment',
    methodName: 'Scan' // musi być public async Task<object> Scan(Stream)
});

export function scanPdfFromDotnet(buffer: Buffer): Promise<any> {
    return new Promise((resolve, reject) => {
        scanPdf(buffer, function (error: any, result: any) {
            if (error) return reject(error);
            resolve(result);
        });
    });
}
