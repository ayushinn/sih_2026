import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';

const url = process.env.OPENAPI_URL || 'http://localhost:8000/openapi.json';
if (!existsSync('src/api/generated')) {
  mkdirSync('src/api/generated', { recursive: true });
}

console.log(`Generating TypeScript definitions from OpenAPI at: ${url}`);
try {
  const res = await fetch(url).catch(() => null);
  if (!res || !res.ok) {
    console.warn(`[WARN] Backend OpenAPI endpoint at ${url} is not reachable.`);
    console.log(`Preserving existing src/api/generated/schema.d.ts.`);
    process.exit(0);
  }
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    if (!json.openapi && !json.swagger) {
      console.warn(`[WARN] Response from ${url} is not an OpenAPI specification.`);
      console.log(`Preserving existing src/api/generated/schema.d.ts.`);
      process.exit(0);
    }
  } catch {
    console.warn(`[WARN] Response from ${url} is not valid JSON.`);
    console.log(`Preserving existing src/api/generated/schema.d.ts.`);
    process.exit(0);
  }

  execSync(`npx openapi-typescript "${url}" -o src/api/generated/schema.d.ts`, {
    stdio: 'inherit',
  });
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
