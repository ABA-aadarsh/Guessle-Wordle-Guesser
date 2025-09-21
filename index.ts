import path from "path";
import fs from "fs/promises";
import * as readline from "readline";
import { alphabets } from "./utils/letters";
import { pickBestWord } from "./utils/wordsList";
import { displayIntro } from "./utils/meta";
import { exit } from "process";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const atLeastLetterFrequency: { letter: string; count: number }[] = [];

const lettersEntropy: { [key: number]: string[] } = {
  0: [...alphabets],
  1: [...alphabets],
  2: [...alphabets],
  3: [...alphabets],
  4: [...alphabets],
};

let currentWord: string | null = null;
const finalisedWord: (string | null)[] = [null, null, null, null, null];
const blackListedLetters = new Set<string>();
let wordsList: string[] = [];

const fetchWordsList = async () => {
  const filepath = path.join(__dirname, "assets", "words.txt");
  const fileData = await fs.readFile(filepath, { encoding: "utf-8" });
  wordsList.push(...fileData.split("\r\n").map(x => x.trim()));
};

const updateMetas = (validationString: ('1' | '0' | '2')[]) => {
  if (!currentWord) {
    console.log("Current Word is null. Cannot update Meta");
    return;
  }

  for (let i = 0; i < 5; i++) {
    if (validationString[i] === "1") {
      finalisedWord[i] = currentWord[i]!;
      lettersEntropy[i] = [currentWord[i]!];
    }
  }

  if(!finalisedWord.includes(null)){
    console.log("Hurray, word is found: ", currentWord);
    exit()
  }

  const misplacedLetters = new Map<string, number[]>();

  for (let i = 0; i < 5; i++) {
    if (validationString[i] === "2") {
      lettersEntropy[i] = lettersEntropy[i]!.filter(x => x !== currentWord![i]);
      const indexes = misplacedLetters.get(currentWord[i]!) || [];
      misplacedLetters.set(currentWord[i]!, [...indexes, i]);
    }
  }

  for (let i = 0; i < 5; i++) {
    if (validationString[i] === "0") {
      lettersEntropy[i] = lettersEntropy[i]!.filter(x => x !== currentWord![i]);
      if (!misplacedLetters.has(currentWord[i]!)) {
        for (let j = 0; j < 5; j++) {
          lettersEntropy[j] = lettersEntropy[j]!.filter(x => x !== currentWord![i]);
          blackListedLetters.add(currentWord[i]!);
        }
      }
    }
  }

  for (const [letter, indexes] of misplacedLetters) {
    const targetIndex = atLeastLetterFrequency.findIndex(x => x.letter === letter);
    if (targetIndex !== -1) {
      atLeastLetterFrequency[targetIndex]!.count = Math.max(
        atLeastLetterFrequency[targetIndex]!.count,
        indexes.length
      );
    } else {
      atLeastLetterFrequency.push({ letter, count: indexes.length });
    }
  }

  // Filter words list
  console.log("Words List Length: ", wordsList.length);
  wordsList = wordsList.filter(word => {
    const letterFreq = new Map<string, number>();

    for (let i = 0; i < 5; i++) {
      const ch = word[i] as string;
      if (blackListedLetters.has(ch)) return false;
      if (!lettersEntropy[i]!.includes(ch)) return false;
      letterFreq.set(ch, (letterFreq.get(ch) || 0) + 1);
    }

    for (const { letter, count } of atLeastLetterFrequency) {
      if ((letterFreq.get(letter) || 0) < count) return false;
    }

    return true;
  });

  console.log("New Words List Length: ", wordsList.length);
  const newPick = pickBestWord(wordsList);
  currentWord = newPick || null;
};

const askUserForValidationString = () => {
  rl.question("Enter response : ", response => {
    const input = response.toLowerCase();

    if (input === "exit") {
      rl.close();
      return;
    }

    if (input === "shuffle") {
      currentWord = pickBestWord(wordsList) || null;
      console.log("Shuffled Word: ", currentWord, "\n");
      askUserForValidationString();
      return;
    }

    if (input === "remove" && currentWord) {
      wordsList = wordsList.filter(x => x !== currentWord);
      console.log("Removed Word: ", currentWord);
      currentWord = pickBestWord(wordsList) || null;
      console.log("New Word: ", currentWord, "\n");
      askUserForValidationString();
      return;
    }

    if(input === "show") {
      console.log(wordsList)
      console.log("Word Suggestion: ", currentWord, "\n");
      askUserForValidationString();
      return;
    }

    if(input === "clear") {
      console.clear()
      console.log("Word Suggestion: ", currentWord, "\n");
      askUserForValidationString()
      return;
    }


    updateMetas(response.split("") as ('0' | '1' | '2')[]);
    console.log("Word Suggestion: ", currentWord, "\n");
    askUserForValidationString();
  });
};

displayIntro()

fetchWordsList().then(() => {
  currentWord = pickBestWord(wordsList) || null;
  console.log("\nFirst Pick: ", currentWord, "\n");
  askUserForValidationString();
});
