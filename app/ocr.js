// Reads text from a photo of a pharmacy bill or printed prescription,
// entirely inside the browser using Tesseract.js (open source).
//
// Privacy: the photo never leaves the device. The first time, the browser
// downloads the reading engine and English language data (a few MB) from a
// public CDN; after that it is cached. No image or text is sent anywhere.
//
// To host the engine yourself, set window.THUNAI_OCR_CONFIG before app.js loads:
//   { script, workerPath, corePath, langPath }

const DEFAULTS = {
  script: "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js",
};

let loading = null;

function loadEngine() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (loading) return loading;
  const cfg = { ...DEFAULTS, ...(window.THUNAI_OCR_CONFIG || {}) };
  loading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = cfg.script;
    s.onload = () => resolve(window.Tesseract);
    s.onerror = () => {
      loading = null;
      reject(new Error("Could not load the photo reader. Check your internet connection and try again."));
    };
    document.head.appendChild(s);
  });
  return loading;
}

// Grayscale, gentle contrast boost and resize: helps with phone photos.
async function prepare(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("That file could not be opened as an image."));
      i.src = url;
    });
    const target = 2000;
    const scale = Math.min(2.5, target / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h);
    const p = data.data;
    for (let i = 0; i < p.length; i += 4) {
      const g = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
      const v = Math.max(0, Math.min(255, (g - 128) * 1.35 + 140));
      p[i] = p[i + 1] = p[i + 2] = v;
    }
    ctx.putImageData(data, 0, 0);
    return c;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function readPhoto(file, onProgress = () => {}) {
  onProgress("Getting the photo ready…", 0);
  const canvas = await prepare(file);
  onProgress("Loading the reader (first time only)…", 0.05);
  const Tesseract = await loadEngine();
  const cfg = window.THUNAI_OCR_CONFIG || {};
  const opts = {
    logger: (m) => {
      if (m.status === "recognizing text") onProgress("Reading the text…", 0.1 + 0.9 * (m.progress || 0));
    },
  };
  for (const k of ["workerPath", "corePath", "langPath"]) if (cfg[k]) opts[k] = cfg[k];
  const worker = await Tesseract.createWorker("eng", 1, opts);
  try {
    const { data } = await worker.recognize(canvas);
    return data.text || "";
  } finally {
    await worker.terminate();
  }
}
