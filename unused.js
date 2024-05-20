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