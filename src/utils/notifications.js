import { TOAST_EVENT } from "../components/ToastProvider";

/**
 * Displays a browser-safe error message fallback.
 */
export function notifyError(message, title = "Action failed") {
    if (typeof window === "undefined") return;

    window.dispatchEvent(new CustomEvent(TOAST_EVENT, {
        detail: {
            type: "error",
            title,
            message: message || "Please try again.",
        },
    }));
}
