'use server'; // <--- THIS IS REQUIRED

import { check } from '../../data/toxic/check'; 

export async function getResult(text: string) {
  // This runs on the server (Node.js)
  const status = await check(text); 
  console.log(`[Server] Input: "${text}" -> Result: ${status}`);
  return status;
}