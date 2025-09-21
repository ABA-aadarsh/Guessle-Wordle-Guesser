import fs from "fs/promises";

async function deduplicateAndFilterWords(
  inputFile: string,
  outputFile: string,
  length: number = 5
) {
  try {
    // Read file
    const content = await fs.readFile(inputFile, "utf8");

    // Split lines, trim, lowercase, filter empty and by length
    const words = content
      .split(/\r?\n/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length === length);

    // Remove duplicates
    const uniqueWords = Array.from(new Set(words));

    // Join back and write
    await fs.writeFile(outputFile, uniqueWords.join("\n"), "utf8");

    console.log(
      `Done! ${words.length} words read, ${uniqueWords.length} unique ${length}-letter words written to ${outputFile}`
    );
  } catch (err) {
    console.error("Error:", err);
  }
}

// // Usage: bun run dedupe5.ts words.txt unique5.txt
// const [inputFile, outputFile] = process.argv.slice(2);
// if (!inputFile || !outputFile) {
//   console.log("Usage: bun run dedupe5.ts input.txt output.txt");
//   process.exit(1);
// }

deduplicateAndFilterWords("./assets/words.txt", "./assets/unique_words.txt");
