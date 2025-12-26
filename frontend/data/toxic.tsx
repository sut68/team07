
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import * as tf from "@tensorflow/tfjs-node";

/**
 * Very simple text model:
 * - Tokenize words
 * - Map to integer ids (vocab)
 * - Pad/truncate to MAX_LEN
 * - Embedding + GlobalAveragePooling + Dense sigmoid
 *
 * Good enough for a baseline.
 */

const CSV_PATH = path.join(process.cwd(), "data", "toxicword.csv");
const OUT_DIR = path.join(process.cwd(), "models", "toxicity_v1");

const MAX_VOCAB = 12000;
const MAX_LEN = 40;

type Row = { text: string; label: number };

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ") // optional: remove urls
    .replace(/[^\p{L}\p{N}\s']/gu, " ") // keep letters/numbers/apostrophe
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string): string[] {
  const t = normalizeText(s);
  if (!t) return [];
  return t.split(" ").filter(Boolean);
}

function buildVocab(rows: Row[]) {
  const freq = new Map<string, number>();
  for (const r of rows) {
    for (const w of tokenize(r.text)) {
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }
  // Sort by frequency desc
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, MAX_VOCAB);

  // Reserve:
  // 0 = PAD
  // 1 = UNK
  const word2id: Record<string, number> = {};
  let id = 2;
  for (const [w] of top) word2id[w] = id++;

  return { word2id };
}

function encode(text: string, word2id: Record<string, number>): number[] {
  const toks = tokenize(text);
  const ids = toks.map((w) => word2id[w] ?? 1); // UNK=1

  // pad/truncate
  if (ids.length > MAX_LEN) return ids.slice(0, MAX_LEN);
  while (ids.length < MAX_LEN) ids.push(0); // PAD=0
  return ids;
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`CSV not found at: ${CSV_PATH}`);
  }

  const csv = fs.readFileSync(CSV_PATH, "utf8");
  const records = parse(csv, {
    columns: false,
    skip_empty_lines: true,
    trim: true,
  }) as string[][];

  // Expect "text,label"
  const rows: Row[] = records
    .map((r) => {
      const text = (r[0] ?? "").toString();
      const label = Number(r[1]);
      return { text, label };
    })
    .filter((r) => r.text && (r.label === 0 || r.label === 1));

  if (rows.length < 50) {
    throw new Error(`Too few rows loaded: ${rows.length}`);
  }

  // Shuffle
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }

  const split = Math.floor(rows.length * 0.9);
  const trainRows = rows.slice(0, split);
  const valRows = rows.slice(split);

  const { word2id } = buildVocab(trainRows);

  const xTrain = tf.tensor2d(trainRows.map((r) => encode(r.text, word2id)), [
    trainRows.length,
    MAX_LEN,
  ]);
  const yTrain = tf.tensor2d(trainRows.map((r) => [r.label]), [
    trainRows.length,
    1,
  ]);

  const xVal = tf.tensor2d(valRows.map((r) => encode(r.text, word2id)), [
    valRows.length,
    MAX_LEN,
  ]);
  const yVal = tf.tensor2d(valRows.map((r) => [r.label]), [valRows.length, 1]);

  const vocabSize = Math.max(...Object.values(word2id), 1) + 1;

  const model = tf.sequential();
  model.add(
    tf.layers.embedding({
      inputDim: vocabSize,
      outputDim: 32,
      inputLength: MAX_LEN,
    })
  );
  model.add(tf.layers.globalAveragePooling1d({}));
  model.add(tf.layers.dense({ units: 32, activation: "relu" }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));

  model.compile({
    optimizer: tf.train.adam(1e-3),
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  });

  console.log(`Loaded rows: ${rows.length}`);
  console.log(`Train: ${trainRows.length}, Val: ${valRows.length}`);
  console.log(`Vocab size: ${vocabSize}`);

  await model.fit(xTrain, yTrain, {
    epochs: 6,
    batchSize: 32,
    validationData: [xVal, yVal],
  });

  // Ensure output dir
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Save TFJS model
  await model.save(`file://${OUT_DIR}`);

  // Save metadata (vocab + params)
  fs.writeFileSync(
    path.join(OUT_DIR, "meta.json"),
    JSON.stringify({ word2id, MAX_LEN }, null, 2),
    "utf8"
  );

  console.log(`✅ Saved model to: ${OUT_DIR}`);

  tf.dispose([xTrain, yTrain, xVal, yVal]);
}

main().catch((e) => {
  console.error("❌ Training failed:", e);
  process.exit(1);
});
