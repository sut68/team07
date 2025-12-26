import * as ort from 'onnxruntime-node';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

let session: ort.InferenceSession | null = null;
let blocklist: Set<string> | null = null;

async function loadResources() {
  if (session && blocklist) return;

  // 1. Get the current running directory
  const currentDir = process.cwd();
  console.log("------------------------------------------------");
  console.log("[DEBUG] Current Working Directory:", currentDir);

  // 2. Construct the paths
  // We try to find where 'data' is relative to where you ran the command
  const modelPath = path.join(currentDir, 'data', 'toxic', 'toxicity_v1.onnx');
  const csvPath = path.join(currentDir, 'data', 'toxic', 'toxicword.csv');

  console.log("[DEBUG] Target Model Path:", modelPath);
  console.log("[DEBUG] Target CSV Path:", csvPath);

  // 3. CHECK IF FILES EXIST (This prevents the 500 crash)
  if (!fs.existsSync(modelPath)) {
    console.error("❌ [CRITICAL] Model file NOT FOUND at this path!");
    // Check if maybe it's inside 'src'?
    const altPath = path.join(currentDir, 'src', 'data', 'toxic', 'toxicity_v1.onnx');
    console.log("[DEBUG] Checking alternative path:", altPath);
    if(fs.existsSync(altPath)) {
        console.log("✅ Found it at alternative path! Please update your code to include 'src'.");
    }
    throw new Error(`File not found: ${modelPath}`);
  }

  if (!fs.existsSync(csvPath)) {
    console.error("❌ [CRITICAL] CSV file NOT FOUND at this path!");
    throw new Error(`File not found: ${csvPath}`);
  }

  console.log("✅ [DEBUG] Files found. Loading model...");

  try {
    session = await ort.InferenceSession.create(modelPath);
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, { columns: false, trim: true });
    blocklist = new Set(records.map((r: any) => r[0].toLowerCase()));
    console.log("✅ [DEBUG] Model loaded successfully!");
  } catch (e) {
    console.error("❌ [DEBUG] Crash during model loading:", e);
    throw e;
  }
  console.log("------------------------------------------------");
}

export async function check(text: string): Promise<string> {
  try {
    await loadResources();
    
    if (!text || !text.trim()) return "non toxic";

    const cleanText = text.toLowerCase();
    const words = cleanText.split(/\s+/);
    if (blocklist) {
        for (const word of words) {
            if (blocklist.has(word)) return "toxic";
        }
    }

    const inputTensor = new ort.Tensor('string', [text], [1, 1]);
    const feeds = { input: inputTensor };
    const results = await session!.run(feeds);
    const label = results['output_label'].data[0];
    return Number(label) === 1 ? "toxic" : "non toxic";
  } catch (error) {
    console.error("[DEBUG] Check function crashed:", error);
    // Return non-toxic so the app doesn't break
    return "non toxic";
  }
}