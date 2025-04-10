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

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
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
          <form action="/upload" method="post" encType="multipart/form-data">
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="cv">Choose file (PDF):</Label>
                <Input
                    className="cursor-pointer"
                    id="file"
                    type="file"
                    name="cv"
                    accept="application/pdf" required
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full">
                  Send CV
                </Button>
                <Button variant="outline" className="w-full">
                  Clear
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
