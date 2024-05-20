import run from './index.js'
import {dbConnection} from './dbConnection.js';

console.log("worker?");
run(5, "food_portion", dbConnection);