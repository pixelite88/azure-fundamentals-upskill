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

  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("https://cv-new-upload-file.azurewebsites.net/api/HttpTrigger1", {
        method: "POST",
        body: formData,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Upload failed");
      }

      const successText = await response.text();
      setStatus(`✅ Sukces: ${successText}`);
    } catch (error: any) {
      setStatus(`❌ Błąd: ${error.message}`);
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
          <form onSubmit={handleSubmit} method="post" encType="multipart/form-data">
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="cv">Choose file (PDF):</Label>
                <Input
                    className="cursor-pointer"
                    id="file"
                    type="file"
                    name="file" accept="application/pdf" required
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full">
                  Send CV
                </Button>
                <Button variant="outline" className="w-full">
                  Clear
                </Button>
                {status && <p>{status}</p>}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
