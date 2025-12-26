import fs from "fs";
import path from "path";
import * as ort from "onnxruntime-node";

// CONFIGURATION
const MAX_SEQ_LEN = 20; // MUST match what you used in Python training
const MODEL_PATH = path.join(process.cwd(), "public", "toxicity_v1.onnx"); // Suggest putting in public
const VOCAB_PATH = path.join(process.cwd(), "public", "vocab.json");

let session: ort.InferenceSession | null = null;
let vocab: Record<string, number> | null = null;

async function loadResources() {
  if (session && vocab) return { session, vocab };

  // 1. Load Vocab
  const vocabData = fs.readFileSync(VOCAB_PATH, "utf8");
  vocab = JSON.parse(vocabData);

  // 2. Load Model
  session = await ort.InferenceSession.create(MODEL_PATH);

  return { session, vocab };
}

function tokenize(text: string, vocabulary: Record<string, number>): bigint[] {
  // Simple cleaning: lowercase, remove punctuation
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const words = clean.split(/\s+/);

  // Map words to IDs
  const tokens = words.map((w) => {
    if (vocabulary && w in vocabulary) return BigInt(vocabulary[w]);
    return BigInt(vocabulary?.["<UNK>"] ?? 1); // Default to UNK if word not found
  });

  // Pad or Truncate to MAX_SEQ_LEN
  if (tokens.length < MAX_SEQ_LEN) {
    const padding = new Array(MAX_SEQ_LEN - tokens.length).fill(BigInt(0));
    return [...tokens, ...padding];
  } else {
    return tokens.slice(0, MAX_SEQ_LEN);
  }
}

export async function checkToxicityResult(text: string): Promise<{ isToxic: boolean; score: number }> {
  try {
    const { session, vocab } = await loadResources();
    
    if (!session || !vocab) throw new Error("Failed to load AI resources");

    // 1. Tokenize Input
    const inputIds = tokenize(text, vocab);
    
    // 2. Create Tensor (Int64 is required for PyTorch Embedding layers)
    const tensorData = BigInt64Array.from(inputIds);
    const inputTensor = new ort.Tensor("int64", tensorData, [1, MAX_SEQ_LEN]);

    // 3. Run Inference
    // Note: 'input' is the name defined in torch.onnx.export. If you changed it, change it here.
    const feeds = { input: inputTensor }; 
    const results = await session.run(feeds);

    // 4. Get Output
    // Output shape is [1, 1] (probability)
    const outputMap = results[Object.keys(results)[0]]; // Get first output
    const data = outputMap.data as Float32Array;
    const score = Number(data[0]);

    return { 
        isToxic: score > 0.5, 
        score 
    };

  } catch (error) {
    console.error("AI Inference Error:", error);
    // Fail safe: If AI crashes, allow message (or block, depending on your policy)
    return { isToxic: false, score: 0 }; 
  }
}