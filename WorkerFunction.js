import { parentPort } from 'worker_threads';
import {defineModel} from './ModelBuilder.js'
import {Sequelize, DataTypes} from 'sequelize';

function WorkerFunction() {
    parentPort.on('message', async (msg) => {
        let newColumnDefintions = await defineModel(msg.columnDefinitions);
        const dbConnection = new Sequelize(msg.dbJSON);
        const newModel = dbConnection.define(msg.filename, newColumnDefintions, {freezeTableName: true});

        let count = 0;
        for (let row of msg.chunk) {
            count++;
            try {
                await newModel.build(row).validate();
                await newModel.create(row);
            } catch (error) {
                console.log("Couldn't insert " + row._id);
                console.log(error);
            }
        }

        parentPort.postMessage({ type: 'complete', message: '' });
    });

    parentPort.postMessage({ type: 'worker-ready', message: 'Worker is ready' });
}

// Run the worker function
WorkerFunction();