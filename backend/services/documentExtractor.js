import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const MAX_EXTRACT_CHARS = 18000;
const MAX_URL_BYTES = 2_500_000;

function collapseWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function stripHtml(html) {
  return collapseWhitespace(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
  );
}

function truncate(text, max = MAX_EXTRACT_CHARS) {
  if (!text || text.length <= max) return text || "";
  return `${text.slice(0, max)}\n\n[Document truncated for analysis — first ${max.toLocaleString()} characters used]`;
}

export async function extractFromUrl(url) {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https URLs are supported");
  }

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "CGS-ESG-ReportAnalyzer/2.0 (Hackathon; +https://cgsi.local)",
      Accept: "text/html,application/xhtml+xml,text/plain,application/pdf,*/*",
    },
    signal: AbortSignal.timeout(30000),
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch URL (${res.status})`);
  }

  const contentType = res.headers.get("content-type") || "";
  const buffer = Buffer.from(await res.arrayBuffer());

  if (buffer.length > MAX_URL_BYTES) {
    throw new Error("Remote document exceeds 2.5 MB size limit");
  }

  if (contentType.includes("pdf") || url.toLowerCase().endsWith(".pdf")) {
    const text = await extractFromPdfBuffer(buffer);
    return {
      sourceType: "url_pdf",
      sourceLabel: url,
      text: truncate(text),
      charCount: text.length,
    };
  }

  const raw = buffer.toString("utf-8");
  const text = contentType.includes("html") ? stripHtml(raw) : collapseWhitespace(raw);

  if (text.length < 80) {
    throw new Error("Could not extract enough text from URL — try uploading the PDF directly");
  }

  return {
    sourceType: "url",
    sourceLabel: url,
    text: truncate(text),
    charCount: text.length,
  };
}

export async function extractFromUpload(file) {
  if (!file?.buffer?.length) {
    throw new Error("No file uploaded");
  }

  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("File exceeds 10 MB limit");
  }

  const name = file.originalname || "upload";
  const mime = file.mimetype || "";

  if (mime === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
    const text = await extractFromPdfBuffer(file.buffer);
    return {
      sourceType: "pdf",
      sourceLabel: name,
      text: truncate(text),
      charCount: text.length,
    };
  }

  if (
    mime.startsWith("text/") ||
    name.toLowerCase().endsWith(".txt") ||
    name.toLowerCase().endsWith(".md")
  ) {
    const text = collapseWhitespace(file.buffer.toString("utf-8"));
    if (text.length < 50) {
      throw new Error("Text file is too short for ESG analysis");
    }
    return {
      sourceType: "text",
      sourceLabel: name,
      text: truncate(text),
      charCount: text.length,
    };
  }

  throw new Error("Unsupported file type — upload PDF, TXT, or MD");
}

async function extractFromPdfBuffer(buffer) {
  try {
    const pdfParse = require("pdf-parse");
    const result = await pdfParse(buffer);
    const text = collapseWhitespace(result.text || "");
    if (text.length < 80) {
      throw new Error("PDF contains insufficient extractable text (may be scanned images)");
    }
    return text;
  } catch (err) {
    throw new Error(
      err.message?.includes("insufficient")
        ? err.message
        : `PDF extraction failed: ${err.message}. Try a text-based PDF or paste content as .txt`
    );
  }
}
