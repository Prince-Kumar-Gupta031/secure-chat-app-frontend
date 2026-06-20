import { useState } from "react";
import dayjs from "dayjs";
import {
  Check,
  CheckCheck,
  FileText,
  FileImage,
  FileArchive,
  Download,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { BACKEND_URL } from "@/lib/apiClient";

function TickIcon({ status }) {
  if (status === "read")
    return (
      <CheckCheck
        className="h-3.5 w-3.5"
        style={{ color: "hsl(var(--tick-read))" }}
      />
    );
  if (status === "delivered")
    return (
      <CheckCheck
        className="h-3.5 w-3.5"
        style={{ color: "hsl(var(--tick-sent))" }}
      />
    );
  return (
    <Check className="h-3.5 w-3.5" style={{ color: "hsl(var(--tick-sent))" }} />
  );
}

function getFileIcon(mime, name) {
  if (mime?.startsWith("image/")) return FileImage;
  if (mime === "application/zip" || /\.zip$/i.test(name || ""))
    return FileArchive;
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
  const res = await fetch(`${BACKEND_URL}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return;
  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl;
  a.download = name || "file";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objUrl);
}

function AttachmentPreview({ attachment }) {
  if (!attachment) return null;
  const url = `${BACKEND_URL}${attachment.url}`;
  const isImage = attachment.mime?.startsWith("image/");
  const isPdf =
    attachment.mime === "application/pdf" ||
    /\.pdf$/i.test(attachment.name || "");

  if (isImage) {
    return (
      <div className="relative group max-w-[280px]">
        <a href={url} target="_blank" rel="noreferrer" className="block">
          <img
            src={url}
            alt={attachment.name}
            className="w-full max-w-[280px] h-auto rounded-sm border border-border/40 object-cover"
          />
        </a>
        <button
          data-testid="msg-download-btn"
          onClick={(e) => {
            e.stopPropagation();
            downloadFile(attachment.url, attachment.name);
          }}
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
      <div className="flex items-center gap-3 p-2.5 bg-background/40 border border-border rounded-sm max-w-[300px]">
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
            className="h-7 px-2 inline-flex items-center justify-center rounded-sm border border-border hover:bg-muted text-[10px] font-mono uppercase tracking-wider"
          >
            View
          </a>
          <button
            data-testid="msg-pdf-download"
            onClick={() => downloadFile(attachment.url, attachment.name)}
            className="h-7 w-7 inline-flex items-center justify-center rounded-sm border border-border hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const Icon = getFileIcon(attachment.mime, attachment.name);
  const ext = (attachment.name || "FILE")
    .split(".")
    .pop()
    .toUpperCase()
    .slice(0, 4);
  return (
    <div className="flex items-center gap-3 p-2.5 bg-background/40 border border-border rounded-sm max-w-[300px]">
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

async function deleteMessage(messageId, deleteForEveryone = false) {
  const token = localStorage.getItem("drdo_token");

  const endpoint = deleteForEveryone
    ? `/api/messages/${messageId}/everyone`
    : `/api/messages/${messageId}/me`;

  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.ok) {
    window.location.reload();
  } else {
    alert("Failed to delete message");
  }
}

export default function MessageBubble({
  message,
  isOwn,
  senderName,
  showSender,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const time = dayjs(message.created_at).format("HH:mm");
  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-fade-in`}
      data-testid={`msg-${message.id}`}
    >
      <div
        className={`relative group overflow-visible max-w-[90vw] sm:max-w-[78%] md:max-w-[65%] px-3 py-2 rounded-md border ${
          isOwn
            ? "bg-bubble-sent border-accent/30 text-foreground rounded-br-sm"
            : "bg-bubble-received border-border rounded-bl-sm"
        }`}
      >
        {showSender && !isOwn && senderName && (
          <div className="font-mono text-[10px] uppercase tracking-wider text-accent mb-0.5">
            {senderName}
          </div>
        )}

        {!message.deleted_for_everyone && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded hover:bg-black/10"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div
                className={`absolute top-6 w-52 bg-card border border-border rounded-md shadow-xl z-[9999]
    ${isOwn ? "right-0" : "left-0"}`}
              >
                <button
                  className="w-full text-left px-3 py-2 hover:bg-muted"
                  onClick={() => deleteMessage(message.id, false)}
                >
                  Delete For Me
                </button>

                {isOwn && (
                  <button
                    className="w-full text-left px-3 py-2 text-red-500 hover:bg-muted"
                    onClick={() => deleteMessage(message.id, true)}
                  >
                    Delete For Everyone
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {message.deleted_for_everyone ? (
          <div className="italic text-sm text-muted-foreground">
            This message was deleted
          </div>
        ) : (
          <>
            {message.attachment && (
              <div className="mb-1.5">
                <AttachmentPreview attachment={message.attachment} />
              </div>
            )}

            {message.text && (
              <div className="text-sm leading-relaxed whitespace-pre-wrap break-all">
                {message.text}
              </div>
            )}
          </>
        )}

        {isOwn && !message.deleted_for_everyone && (
          <div className="flex justify-end gap-1 mb-1"></div>
        )}

        <div
          className={`flex items-center gap-1.5 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}
        >
          <span className="font-mono text-[10px] text-muted-foreground">
            {time}
          </span>
          {isOwn && !message.is_group && <TickIcon status={message.status} />}
        </div>
      </div>
    </div>
  );
}
