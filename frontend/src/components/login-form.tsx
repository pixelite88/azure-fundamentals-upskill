import {cn} from "@/lib/utils"
import {Button} from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
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
                const res = await fetch("https://cv-scanner-func-gkcrd3hgehbtc8gd.polandcentral-01.azurewebsites.net/api/UploadCv", {
                method: "POST",
                headers: {"Content-Type": "application/pdf"},
                body: formData,
            });

            const result = await res.text();
            console.log("response:", result);

            if (res.ok) {
                console.log("ok", res);
                // @ts-ignore
                setStatus(`Sukces: ${res.status} - ${res.statusText}`);
            } else {
                console.log("nieok", res);
                // @ts-ignore
                setStatus(`Błąd: ${res.error}`);
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