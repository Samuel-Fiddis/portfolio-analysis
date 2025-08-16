import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DialogWrapperProps extends React.ComponentProps<"div"> {
  buttonText: string;
  dialogTitle?: string;
  dialogDescription?: string;
}

export default function DialogWrapper({
  buttonText,
  dialogTitle,
  dialogDescription,
  children,
}: DialogWrapperProps) {
  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button variant="outline">{buttonText}</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[1800px]">
          <DialogHeader>
            {dialogTitle && <DialogTitle>{dialogTitle}</DialogTitle>}
            {dialogDescription && (
              <DialogDescription>{dialogDescription}</DialogDescription>
            )}
          </DialogHeader>
          <div className="grid gap-4">{children}</div>
        </DialogContent>
      </form>
    </Dialog>
  );
}
