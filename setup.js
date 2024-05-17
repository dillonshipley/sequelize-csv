import os from 'os';
import path from 'path';
import readline from "readline";
import fs from 'fs';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });


function getThreads(numCPUs) {
    return new Promise((resolve, reject) => {
      rl.question(`\nHow many threads would you like to use to run this load? Availabe: ${numCPUs}\n`, (answer) => {
        const number = parseFloat(answer);
        if (isNaN(number) || !isNaN(number) > (numCPUs - 1) || number === 0) {
          console.log('\x1b[31m%s\x1b[0m', 'Invalid input. Please enter a valid number.');
          getThreads(numCPUs).then(resolve);
        } else {
          resolve(number);
        }
      });
    });
}

function chooseFile(csvFiles, textString){
    return new Promise((resolve, reject) => {
        rl.question(textString, (answer) => {
            if(csvFiles.includes(answer + ".csv"))
                resolve(answer);
            else{
                console.log('\x1b[31m%s\x1b[0m', "\nCSV file not found. Please try again.")
                chooseFile(csvFiles, textString).then(resolve);
            }
        })
    })
}

export default async function setup(){
    
    //Retrieve the number of threads to be used for this operation
    const numCPUs = os.cpus().length;
    let threads = await getThreads(numCPUs - 1);

    //Ask the user which csv file from the current directory they'd like to load
    const files = await fs.promises.readdir('./');
    const csvFiles = files.filter(file => path.extname(file).toLowerCase() === '.csv');
    let textString = "\nPlease choose a CSV file to load";
        
    csvFiles.forEach(file => {
        textString = textString.concat("\n", file);
    });
    textString = textString.concat("\n!! Do not include '.csv' in your response !!\n");

    // Assuming chooseFile is an asynchronous function, await it
    let file = await chooseFile(csvFiles, textString);
    
    return [threads, file];
}