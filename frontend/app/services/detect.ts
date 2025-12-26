export type ToxicityResult = "toxic" | "non toxic";

async function CheckToxicity(text: string) {
  const res = await fetch("/api/toxicity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  return await res.json() as { result: ToxicityResult; toxic: boolean };
}

export { CheckToxicity };
