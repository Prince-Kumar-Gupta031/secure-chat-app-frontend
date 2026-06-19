import { Check, CheckCheck, FileText, FileImage, FileArchive, Download } from "lucide-react";
import dayjs from "dayjs";
import { BACKEND_URL } from "@/lib/apiClient";

function TickIcon({ status }) {
    if (status === "read") return <CheckCheck className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--tick-read))" }} />;
    if (status === "delivered") return <CheckCheck className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--tick-sent))" }} />;
    return <Check className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--tick-sent))" }} />;
}

function getFileIcon(mime, name) {
    if (mime?.startsWith("image/")) return FileImage;
    if (mime === "application/zip" || /\.zip$/i.test(name || "")) return FileArchive;
    return FileText;
}

function fmtSize(b) {
    if (b == null) return "";
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

async function downloadFile(url, name) {
    const token = localStorage.getItem("drdo_token");
    const res = await fetch(`${BACKEND_URL}${url}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl; a.download = name || "file"; document.body.appendChild(a); a.click();
    a.remove(); URL.revokeObjectURL(objUrl);
}

function AttachmentPreview({ attachment }) {
    if (!attachment) return null;
    const url = `${BACKEND_URL}${attachment.url}`;
    const isImage = attachment.mime?.startsWith("image/");
    const isPdf = attachment.mime === "application/pdf" || /\.pdf$/i.test(attachment.name || "");

    if (isImage) {
        return (
            /*
             * w-full + max-w-full: image fills the bubble but never overflows.
             * max-h-[50vh]: tall portrait photos don't push the input bar off screen.
             */
            <div className="relative group w-full">
                <a href={url} target="_blank" rel="noreferrer" className="block">
                    <img
                        src={url}
                        alt={attachment.name}
                        className="w-full max-w-full h-auto max-h-[50vh] rounded-sm border border-border/40 object-contain block"
                    />
                </a>
                <button
                    data-testid="msg-download-btn"
                    onClick={(e) => { e.stopPropagation(); downloadFile(attachment.url, attachment.name); }}
                    className="absolute top-1.5 right-1.5 h-7 w-7 rounded-sm bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    title="Download"
                >
                    <Download className="h-3.5 w-3.5" />
                </button>
            </div>
        );
    }

    if (isPdf) {
        return (
            /*
             * w-full so the card never overflows.
             * min-w-0 on inner flex children prevents overflow from long filenames.
             */
            <div className="flex items-center gap-2 p-2.5 bg-background/40 border border-border rounded-sm w-full min-w-0">
                <div className="h-10 w-10 rounded-sm bg-destructive/15 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-destructive" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{attachment.name}</div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {fmtSize(attachment.size)} · PDF
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        data-testid="msg-pdf-view"
                        className="h-7 px-2 inline-flex items-center justify-center rounded-sm border border-border hover:bg-muted text-[10px] font-mono uppercase tracking-wider whitespace-nowrap"
                    >
                        View
                    </a>
                    <button
                        data-testid="msg-pdf-download"
                        onClick={() => downloadFile(attachment.url, attachment.name)}
                        className="h-7 w-7 inline-flex items-center justify-center rounded-sm border border-border hover:bg-muted shrink-0"
                    >
                        <Download className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        );
    }

    const Icon = getFileIcon(attachment.mime, attachment.name);
    const ext = (attachment.name || "FILE").split(".").pop().toUpperCase().slice(0, 4);
    return (
        <div className="flex items-center gap-2 p-2.5 bg-background/40 border border-border rounded-sm w-full min-w-0">
            <div className="h-10 w-10 rounded-sm bg-accent/15 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-xs font-medium truncate">{attachment.name}</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {fmtSize(attachment.size)} · {ext}
                </div>
            </div>
            <button
                data-testid="msg-file-download"
                onClick={() => downloadFile(attachment.url, attachment.name)}
                className="h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-sm border border-border hover:bg-muted"
            >
                <Download className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

export default function MessageBubble({ message, isOwn, senderName, showSender }) {
    const time = dayjs(message.created_at).format("HH:mm");

    return (
        <div
            className={`flex w-full min-w-0 ${isOwn ? "justify-end" : "justify-start"} animate-fade-in`}
            data-testid={`msg-${message.id}`}
        >
            <div
                className={`
                    min-w-0
                    px-3 py-2 rounded-md border
                    ${isOwn
                        ? "bg-bubble-sent border-accent/30 text-foreground rounded-br-sm"
                        : "bg-bubble-received border-border rounded-bl-sm"
                    }
                `}
                style={{
                    /*
                     * Clamp bubble width:
                     *   • Never wider than 85 vw on any screen (prevents overflow on 320px phones)
                     *   • Capped at 65% on desktop via the sm breakpoint override below
                     * Using inline style because Tailwind's max-w-[85vw] and arbitrary values
                     * can collide; the inline style is the ground truth.
                     */
                    maxWidth: "min(85vw, 480px)",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                }}
            >
                {/* Group sender name */}
                {showSender && !isOwn && senderName && (
                    <div className="font-mono text-[10px] uppercase tracking-wider text-accent mb-0.5 truncate">
                        {senderName}
                    </div>
                )}

                {/* Attachment */}
                {message.attachment && (
                    <div className="mb-1.5 w-full min-w-0">
                        <AttachmentPreview attachment={message.attachment} />
                    </div>
                )}

                {/* Text */}
                {message.text && (
                    <div
                        className="text-sm leading-relaxed whitespace-pre-wrap"
                        style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
                    >
                        {message.text}
                    </div>
                )}

                {/* Timestamp + ticks */}
                <div className={`flex items-center gap-1.5 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">{time}</span>
                    {isOwn && !message.is_group && <TickIcon status={message.status} />}
                </div>
            </div>
        </div>
    );
}