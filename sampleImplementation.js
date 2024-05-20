import run from './index.js'
import {dbConnection} from './dbConnection.js';

console.log("worker?");
run(3, "food_category", dbConnection);