Hello! Thank you for checking out my package!
sequelize-csv-auto is an O(n) multithreaded column-detecting file loader using the Sequelize ORM. 

Please see the GitHub
(https://github.com/dillonshipley/sequelize-csv)

As well as the sample implementation
(https://github.com/dillonshipley/sequelize-csv-sample)

For the source code as well as information on how it works. 

Version 1.0.1 only implements one command, run. Run takes 3 arguments:
1. Number of threads you will be using to load the .csv file
2. The name of the csv file to load as well as the resulting database table
3. Database information - which should be an object structured
{
    username: '[INSERT USERNAME]',
    password: '[INSERT PASSWORD]',
    host: '[INSERT HOST - for example 00.000.000.00]',
    database: '[INSERT DATABASE]',
    port: '[INSERT PORT]',
    dialect: 'postgres',
    logging: false
}

During your implementation, make sure that the js file running sequelize-csv-auto resides in the same folder as the csv file.