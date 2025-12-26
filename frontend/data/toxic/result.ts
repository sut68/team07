import fs from "fs";
import path from "path";
import * as ort from "onnxruntime-node";

const MODEL_PATH = path.join(process.cwd(), "data", "toxicity_v1.onnx");
const META_PATH = path.join(process.cwd(), "data", "toxicity_v1.meta.json");

let cached:
  | null
  | {
      session: ort.InferenceSession;
      threshold: number;
      inputName: string;
    } = null;

async function loadModel() {
  if (cached) return cached;

  if (!fs.existsSync(MODEL_PATH)) {
    throw new Error("toxicity_v1.onnx not found");
  }
  if (!fs.existsSync(META_PATH)) {
    throw new Error("toxicity_v1.meta.json not found");
  }

  const meta = JSON.parse(fs.readFileSync(META_PATH, "utf8"));
  const session = await ort.InferenceSession.create(MODEL_PATH);

  cached = {
    session,
    threshold: Number(meta.threshold ?? 0.5),
    inputName: String(meta.input_name ?? "input"),
  };

  return cached;
}

/**
 * @returns 1 = toxic, 0 = non-toxic
 */
export async function checkToxicity(text: string): Promise<0 | 1> {
  const { session, threshold, inputName } = await loadModel();

  const input = new ort.Tensor("string", [String(text ?? "")], [1, 1]);

  const outputs = await session.run({
    [inputName]: input,
  });

  const outName = Object.keys(outputs)[0];
  const out = outputs[outName] as ort.Tensor;
  const data = out.data as number[] | Float32Array;

  const score =
    data.length === 1
      ? Number(data[0])
      : Number(data[data.length - 1]);

  return score >= threshold ? 1 : 0;
}
