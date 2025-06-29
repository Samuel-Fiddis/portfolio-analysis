import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface InputWithButtonProps {
  inputType: string;
  inputPlaceHolder: string;
  buttonType?: "submit" | "button";
  buttonVariant?: "default" | "outline" | "ghost" | "link";
  buttonText?: string;
  asChild?: boolean;
  [key: string]: any;
}

export function InputWithButton({
  inputType,
  inputPlaceHolder,
  buttonType,
  buttonVariant,
  buttonText,
  asChild = false,
  onChange,
  onClick,
  ...props
}: InputWithButtonProps) {
  return (
    <div className="flex w-full max-w-sm items-center gap-2">
      <Input type={inputType} placeholder={inputPlaceHolder} onChange={onChange} />
      <Button type={buttonType} variant={buttonVariant} onClick={onClick} {...props}>
        {buttonText}
      </Button>
    </div>
  )
}