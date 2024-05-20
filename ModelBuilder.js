import moment from "moment";
import { DataTypes } from "sequelize";

// Define a function to create dynamic model
export function defineModel(modelName, columnDefinitions, dbConnection) {
    for (let column in columnDefinitions) {
        switch(columnDefinitions[column].type){
            case "string":
                columnDefinitions[column].type = DataTypes.STRING;
                break;
            case "date":
                columnDefinitions[column].type = DataTypes.DATE;
                break;
            case "boolean":
                columnDefinitions[column].type = DataTypes.BOOLEAN;
                break;
            case "int":
                columnDefinitions[column].type = DataTypes.INTEGER;
                break;
            case "float":
                columnDefinitions[column].type = DataTypes.FLOAT;
                break;
        }
    }
    const Model = dbConnection.define(modelName, columnDefinitions);
    return Model;
}

export function detectColumns(sample, columns){
    let columnDefinitions = {};
    for (let column of columns) {
        let dataType;
        const values = sample.map(row => row[column]);
        if (column === "id") column = "_id";
        if (values.every(value => !isNaN(parseInt(value))) && values.every(value => Number.isInteger(value))) {
            dataType = "int";
        } else if (values.every(value => value === 'true' || value === 'false')) {
            dataType = "boolean";
        } else if (values.every(value => !isNaN(parseFloat(value)))) {
            dataType = "float";
        } else if (values.every(value => moment(value, moment.ISO_8601, true).isValid())) {
            dataType = "date";
        } else {
            dataType = "string";
        }
        
        columnDefinitions[column] = {
            type: dataType,
            allowNull: true,
        };
    }

    return columnDefinitions;
}