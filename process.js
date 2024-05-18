
import fs from 'fs/promises';



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
                removedQuotation = rowData[i].replace(/\r/g, '');

                if(typeof(rowData[i]) === 'string')
                    object[thisColumn] = rowData[i]
                else if(!isNaN(parseInt(removedQuotation)) && Number.isInteger(removedQuotation)){
                    object[thisColumn] = parseInt(removedQuotation);
                }
                else if(!isNaN(parseFloat(removedQuotation)))
                    object[thisColumn] = parseFloat(removedQuotation);
                else if(removedQuotation === true || removedQuotation === false)
                    object[thisColumn] = Boolean(removedQuotation);
                else {
                    let potentialDate = new Date(removedQuotation);
                    if(!isNaN(potentialDate.getTime()))
                        object[thisColumn] = potentialDate;
                    else 
                        object[thisColumn] = "";
                    }
            }    
        }
        if(!object.hasOwnProperty("gram_weight") || !isNaN(parseFloat(object.gram_weight)))
            formatRows.push(object);
    });
    formatRows = formatRows.filter(item => item.id != '');
    return formatRows;
}

export default async function readCSV(filename){
    const data = await fs.readFile('./' + filename + '.csv', 'utf-8');
    //Derive the columns from the first row of the csv file
    const allRows = data.split('\n');
    var columns = allRows[0].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    for(let i = 0; i < columns.length; i++)
        columns[i] = columns[i].replace(/"/g, '').replace(/\r/g, '');
    allRows.shift();
        
    //commenting while testing multithreading
    //convert the data into more standard looking objects
    const rows = processData(allRows, columns);
        //add a database model based on the columns of the csv
    return [columns, rows];
        

};
