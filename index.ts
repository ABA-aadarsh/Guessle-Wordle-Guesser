import path from "path"
import fs from "fs/promises"
import * as readline from "readline";
import { alphabets, type Alphabet } from "./utils/letters";
import { pickBestWord } from "./utils/wordsList";
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});



const atLeastLetterFrequency: {alphabet: Alphabet, count: number}[] = []

const lettersEntropy: {[key:number]: Alphabet[]} = {
  0: [...alphabets] ,
  1: [...alphabets] ,
  2: [...alphabets] ,
  3: [...alphabets] ,
  4: [...alphabets] 
}
let currentWord : Alphabet[] | null = null;
const finalisedWord: [Alphabet | null, Alphabet | null, Alphabet | null, Alphabet | null, Alphabet | null] = [null, null, null, null, null]
const blackListedLetters = new Set<Alphabet>()
let wordsList: Alphabet[] = []

const fetchWordsList = async () => {
  const filepath = path.join(__dirname, "assets", "words.txt")
  const fileData = await fs.readFile(filepath, {encoding: "utf-8"})
  //@ts-expect-error I dont know how to assign it here.
  wordsList.push(...fileData.split("\r\n").map(x=>x.trim()))
}


const updateMetas = (validationString: ('1' | '0' | '2')[]) => {
  if(currentWord === null) {
    console.log("Current Word is null. Cannot update Meta");
    return;
  }
  for(let i = 0; i<5; i++){
    if(validationString[i] == "1") {
      finalisedWord[i] = currentWord[i]
      lettersEntropy[i] = [currentWord[i]]
    }
  }
  const misplacedLetters = new Map<Alphabet, number[]>() // Alphabet, misplacedIndex, misplacedCount
  for(let i = 0; i<5; i++){
    if(validationString[i] == "2"){
      lettersEntropy[i] = lettersEntropy[i]?.filter(x=>x!=currentWord[i]) as Alphabet[]
      const indexes = misplacedLetters.get(currentWord[i]) || []
      misplacedLetters.set(currentWord[i], [...indexes, i]);
    }
  }
  for(let i = 0; i<5; i++) {
    if(validationString[i] == "0") {
      lettersEntropy[i] = lettersEntropy[i]?.filter(x=>x!=currentWord[i]) as Alphabet[]
      if(misplacedLetters.get(currentWord[i])==undefined){
        // remove entropy from everywhere
        for(let j = 0; j<5; j ++ ) {
          lettersEntropy[j] = lettersEntropy[j]?.filter(x=>x!=currentWord[i]) as Alphabet[]
          blackListedLetters.add(currentWord[i])
        }
      }
    }
  }
  for(const [alphabet, indexes] of misplacedLetters) {
    const targetIndex = atLeastLetterFrequency.findIndex(x=>x.alphabet==alphabet)
    if(targetIndex!=-1) {
      atLeastLetterFrequency[targetIndex]!.count = Math.max(atLeastLetterFrequency[targetIndex]!.count, indexes.length)
    }else{
      atLeastLetterFrequency.push({alphabet, count: indexes.length})
    }
  }

  // now comes the part where we update the words List:
  console.log("Words List Length: ", wordsList.length)
  wordsList = wordsList.filter(
    word=>{
      const letterFreq = new Map<Alphabet, number>()
      for (let i = 0; i <5; i ++ ){
        
        const ch = word[i] as Alphabet
        if(blackListedLetters.has(ch as Alphabet)){
          return false
        }
        if(!lettersEntropy[i]!.includes(ch)) {
          return false;
        }
        letterFreq.set(ch as Alphabet, (letterFreq.get(ch as Alphabet) || 0) + 1)
      }
      for( const {alphabet, count} of atLeastLetterFrequency) {
        if((letterFreq.get(alphabet) || 0) < count) return false;
      }
      return true;
    }
  )
  console.log("New Words List Length: ", wordsList.length)
  const newPick = pickBestWord(wordsList)
  if(!newPick){
    console.log("No Pick")
    return;
  }
  // @ts-ignore
  currentWord = newPick
}

const askUserForValidationString = () => {
  rl.question("Enter response : ", (response) => {
    if(response.toLowerCase() == "exit") {
      rl.close()
      return;
    }
    else if(response.toLowerCase() == "shuffle"){
      const word  = pickBestWord(wordsList)
      currentWord = word as unknown as Alphabet[] || null;
      console.log("Shuffled Word: ", currentWord);
      askUserForValidationString();
    }
    //@ts-ignore
    updateMetas(response)
    console.log("Word Suggestion: ", currentWord);
    askUserForValidationString()
  })
}


fetchWordsList().then(
  () => {
    //@ts-ignore
    currentWord = pickBestWord(wordsList)
    console.log("First Pick: ", currentWord)
    askUserForValidationString()
  }
)