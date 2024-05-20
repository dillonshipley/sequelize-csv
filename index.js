import { readCSV, reprocessData } from "./process.js";
import {defineModel, detectColumns} from './ModelBuilder.js'

import cluster from "cluster";
import os  from 'os';

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

export default async function run(threads, filename, dbConnection){
    if (cluster.isPrimary) {
        let processedData = await readCSV(filename);
        let columns = processedData[0];
        let csv_data = processedData[1];
        
        let sampleData = csv_data.slice(0, 100);
        let columnDefinitions = detectColumns(sampleData, columns);
        let finalData = reprocessData(csv_data, columnDefinitions);

        let newModel = await defineModel(filename, columnDefinitions, dbConnection);
        await newModel.drop();
        await newModel.sync();

        /* TESTING MODEL GENERATION - DELETE LATER */
        /*
        let count = 0;
            for(var row of csv_data.slice(0, 5000)){
                count++;
                if(count % 100 == 0)
                    console.log(count);
                try{
                    await newModel.build(row).validate();
                    await newModel.create(row);
                } catch (error){
                    console.log("couldn't insert " + row._id)
                    console.log(error);
                }  
            }*/
        /* END OF TESTING MODEL GENERATION */
        let chunkLength = Math.trunc(finalData.length / threads);
        let remainder = csv_data.length % threads;
        
        let numComplete = 0;
        for (let i = 0; i < threads; i++) {
            let chunk = null;
            if(i == threads - 1)
                chunk = finalData.slice(i * chunkLength, ((i + 1) * chunkLength) + remainder)
            else                 
                chunk = finalData.slice(i * chunkLength, (i + 1) * chunkLength);
            let worker = cluster.fork();
            waitForWorkerMessage(worker).then((msg) => {
                if(msg === "send")
                    worker.send({ chunk: chunk, filename: filename, columnDefinitions: columnDefinitions});
                waitForWorkerMessage(worker).then((msg) => {
                    if(msg == "complete")
                        numComplete++;
                    if(numComplete == threads){
                        console.log('\x1b[32m%s\x1b[0m', "CSV file successfully loaded")
                        cluster.disconnect(() => {
                            console.log('\x1b[32m%s\x1b[0m', 'Cluster disconnected');
                        });
                        return;
                    }
                });
                return;
            });
            
        }
    } else if (cluster.isWorker){
        process.on('message', async (msg) => {
            let newModel = await defineModel(msg.filename, msg.columnDefinitions, dbConnection);
            let count = 0;
            for(var row of msg.chunk){
                count++;
                if(count % 100 == 0)
                    console.log(count);
                try{
                    await newModel.build(row).validate();
                    await newModel.create(row);
                } catch (error){
                    console.log("couldn't insert" + row._id)
                    console.log(error);
                }  
            }

            process.send({type: 'complete', message: ''});
            process.exit();
        });
        process.send({type: 'worker-ready', message: 'Worker is ready'});
    }
}