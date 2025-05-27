import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {useState} from "react";

export function LoginForm({
                              className,
                              ...props
                          }: React.ComponentProps<"div">) {

    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState("");

    const handleUpload = async () => {
        if (!file) return;

        setStatus("Wysyłanie...");

        const formData = new FormData();
        formData.append("cv", file);

        try {
            const res = await fetch("https://cv-new-upload-file.azurewebsites.net/api/UploadCv", {
                method: "POST",
                body: formData,
            });

            console.log(res);

            const result = await res.json();
            if (res.ok) {
                setStatus(`Sukces: ${result.message}`);
            } else {
                setStatus(`Błąd: ${result.error}`);
            }
        } catch (err) {
            setStatus(`Błąd połączenia ${JSON.stringify(err)}`);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>CV uploader</CardTitle>
                    <CardDescription>
                        Add your CV and upload to the server
                    </CardDescription>
                </CardHeader>
                <CardContent>

                        <div className="flex flex-col gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="cv">Choose file (PDF):</Label>
                                <Input
                                    className="cursor-pointer"
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button onClick={handleUpload} variant={"ghost"} className="w-full">
                                    Send CV
                                </Button>
                                <Button variant="outline" className="w-full">
                                    Clear
                                </Button>
                                {status && <p>{status}</p>}
                            </div>
                        </div>

                </CardContent>
            </Card>
        </div>
    )
}