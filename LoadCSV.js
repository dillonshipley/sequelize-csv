import cluster from 'cluster';
import setup from './setup.js';
import readCSV from './process.js'
import moment from 'moment';
import {DataTypes} from 'sequelize';
import { sequelize } from "./dbConnection.js";


// Define a function to create dynamic model
function defineModel(modelName, rows) {
    console.log("Defining model");
    let sample = rows[0];
    let columnDefinitions = {};
    for (const column in sample) {
        let dataType;
        const values = rows.map(row => row[column]);
        if (values.every(value => !isNaN(parseInt(value))) && values.every(value => Number.isInteger(value))) {
            dataType = DataTypes.INTEGER;
        } else if (values.every(value => value === 'true' || value === 'false')) {
            dataType = DataTypes.BOOLEAN;
        } else if (values.every(value => !isNaN(parseFloat(value)))) {
            dataType = DataTypes.FLOAT;
        } else if (values.every(value => moment(value, moment.ISO_8601, true).isValid())) {
            dataType = DataTypes.DATE;
        } else {
            dataType = DataTypes.STRING;
        }
        
        columnDefinitions[column] = {
            type: dataType,
            allowNull: false,
            primaryKey: column === 'id'
        };
    }
    const Model = sequelize.define(modelName, columnDefinitions);
    return Model;
}


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

async function run(){
    if (cluster.isPrimary) {
        let values = await setup();
        let processedData = await readCSV(values[1]);
        let csv_data = processedData[1];

        let chunkLength = Math.trunc(csv_data.length / values[0]);
        let remainder = csv_data.length % values[0];
        
        let numComplete = 0;
        for (let i = 0; i < values[0]; i++) {
            let chunk = null;
            if(i == values[0] - 1)
                chunk = csv_data.slice(i * chunkLength, ((i + 1) * chunkLength) + remainder)
            else                 
                chunk = csv_data.slice(i * chunkLength, (i + 1) * chunkLength)
            
            let worker = cluster.fork();
            waitForWorkerMessage(worker).then((msg) => {
                if(msg === "send")
                    worker.send({ chunk: chunk, filename: values[1]});
                waitForWorkerMessage(worker).then((msg) => {
                    if(msg == "complete")
                        numComplete++;
                    if(numComplete == values[0]){
                        console.log("csv file loaded!")
                        cluster.disconnect();
                        return;
                    }
                })
            });
        }
        //await readCSV(values);
    } else if (cluster.isWorker){
        process.on('message', async (msg) => {
            let sample = msg.chunk;
            let newModel = await defineModel(msg.filename, sample);
            await newModel.sync();
            let count = 0;
            for(var row of msg.chunk){
                count++;
                if(count % 100 == 0)
                    console.log(count);
                try{
                    await newModel.build(row).validate();
                    await newModel.create(row);
                } catch (error){
                    console.log("couldn't insert" + row.id)
                }  
            }
            console.log("works");
            process.send({type: 'complete', message: ''});
        });
        process.send({type: 'worker-ready', message: 'Worker is ready'});
    }
}


await run();
