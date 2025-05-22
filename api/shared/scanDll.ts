import * as edge from 'edge-js';
import * as path from 'path';

const dllPath = path.join(__dirname, 'S_RiskAssessment.dll');

const scan = edge.func({
    assemblyFile: dllPath,
    typeName: 'S_RiskAssessment.Scanner',     // klasa z pliku dll
    methodName: 'Scan'                        // metoda z dll
});

export const scanBuffer = async (buffer: Buffer): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        scan(buffer.toString('base64'), (err: Error, result: boolean) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};
