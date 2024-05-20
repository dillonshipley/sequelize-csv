
import fs from 'fs/promises';
import moment from "moment";

// Function to process CSV data
function processData(rows, columns) {
    let formatRows = [];
    rows.forEach(row => {
        let object = {};
        const rowData = row.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        for(let i = 0; i < columns.length; i++){
            let thisColumn = columns[i];
            if(thisColumn === "id") thisColumn = "_id";
            if(rowData[i] != null) {
                let removedQuotation = rowData[i].replace(/"/g, '');
                removedQuotation = removedQuotation.replace(/\r/g, '');
                object[thisColumn] = removedQuotation;
            }
        }
        formatRows.push(object);
    });

    formatRows = formatRows.filter(item => item.id != '');
    return formatRows;
}

export function reprocessData(csv_data, columnDefinitions){
    let formattedData = [];
    for(let row of csv_data){
        let object = {};
        for(let col in row){
            if(col == "id") col = "_id";
            let column = columnDefinitions[col];
            switch(column.type){
                case "string":
                    object[col] = String(row[col]);
                    break;
                case "int":
                    if(!isNaN(parseInt(row[col])))
                        object[col] = parseInt(row[col])
                    else
                        object[col] = 0;
                    break;
                case "float":
                    if(!isNaN(parseFloat(row[col])))
                        object[col] = parseFloat(row[col])
                    else
                        object[col] = 0;
                    break;
                case "boolean":
                    object[col] = Boolean(row[col]);
                    break;
                case "date":
                    if(moment(row[col], moment.ISO_8601, true).isValid())
                        object[col] = moment(row[col], moment.ISO_8601, true)
                    else
                        object[col] = '9999-12-31';
            }
        }
        formattedData.push(object);
    }
    return formattedData;
}

export async function readCSV(filename){
    const data = await fs.readFile('./' + filename + '.csv', 'utf-8');
    //Derive the columns from the first row of the csv file
    const allRows = data.split('\n');
    var columns = allRows[0].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    for(let i = 0; i < columns.length; i++)
        columns[i] = columns[i].replace(/"/g, '').replace(/\r/g, '');
    allRows.shift();

    //convert the data into more standard looking objects
    const rows = processData(allRows, columns);
        //add a database model based on the columns of the csv
    return [columns, rows];
        

};
