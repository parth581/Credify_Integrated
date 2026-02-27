import { toast } from "sonner"

/**
 * Show an in-page toast notification (replaces browser alert)
 * @param message - Full message text (first line becomes title, rest becomes description)
 * @param variant - Toast variant type
 */
export function showAppToast(
  message: string,
  variant: "success" | "error" | "info" | "warning" = "info"
) {
  const lines = message.split("\n").filter((line) => line.trim())
  const title = lines[0] || message
  const description = lines.slice(1).join("\n") || undefined

  const toastOptions = {
    duration: variant === "error" ? 5000 : 4000,
  }

  switch (variant) {
    case "success":
      toast.success(title, { description, ...toastOptions })
      break
    case "error":
      toast.error(title, { description, ...toastOptions })
      break
    case "warning":
      toast.warning(title, { description, ...toastOptions })
      break
    default:
      toast.info(title, { description, ...toastOptions })
  }
}
