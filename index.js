import { readCSV, reprocessData } from "./process.js";
import {defineModel, detectColumns} from './ModelBuilder.js'
import { fileURLToPath } from 'url';
import { Worker} from "worker_threads";

import {Sequelize} from 'sequelize';

import { dirname } from "path";
import os from 'os';
let __dirname = dirname(fileURLToPath(import.meta.url));

const workerPath = `${__dirname}/WorkerFunction.js`;


function waitForWorkerMessage(worker) {
    return new Promise((resolve) => {
        worker.on('message', (msg) => {
            if (msg.type === 'worker-ready') {
                resolve("send");
            } else if (msg.type === 'complete') {
                resolve("complete")
            }
        });
    });
}

export default async function run(threads, filename, dbJSON){
    if(isNaN(threads) || threads > os.cpus().length - 1){
        console.log('\x1b[31m%s\x1b[0m', `The maximum number of threads available is ${os.cpus().length - 1}. You entered ${threads} threads.`)
    };
    let processedData = await readCSV(filename);
    if(processedData[0] === 0)
        return;
    let columns = processedData[0];
    let csv_data = processedData[1];
    
    let sampleData = csv_data.slice(0, 100);
    let columnDefinitions = detectColumns(sampleData, columns);
    let finalData = reprocessData(csv_data, columnDefinitions);
    let newColumnDefintions = await defineModel(columnDefinitions);
    
    const dbConnection = new Sequelize(dbJSON);
    const newModel = dbConnection.define(filename, newColumnDefintions, {freezeTableName: true});

    await newModel.drop();
    await newModel.sync();

    let chunkLength = Math.trunc(finalData.length / threads);
    let remainder = csv_data.length % threads;
    
    let numComplete = 0;
    for (let i = 0; i < threads; i++) {
        let chunk = null;
        if(i == threads - 1)
            chunk = finalData.slice(i * chunkLength, ((i + 1) * chunkLength) + remainder)
        else                 
            chunk = finalData.slice(i * chunkLength, (i + 1) * chunkLength);
        let worker = new Worker(workerPath, {type: "module"})
        waitForWorkerMessage(worker).then((msg) => {
            if(msg === "send")
                worker.postMessage({ chunk: chunk, filename: filename, columnDefinitions: columnDefinitions, dbJSON: dbJSON});
            waitForWorkerMessage(worker).then((msg) => {
                if(msg == "complete")
                    numComplete++;
                    worker.terminate()
                        .catch((error) => console.error('Error terminating worker:', error));
                if(numComplete == threads){
                    console.log('\x1b[32m%s\x1b[0m', `CSV file successfully loaded. Check your database for the table ${newModel.getTableName()}`);
                    console.log('Shutting down threads');
                    return;
                }
            });
            return;
        });
        
    }
}