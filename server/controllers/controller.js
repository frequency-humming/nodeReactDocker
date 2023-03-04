const {Pool} = require('pg');

const pool = new Pool ({
    user:'admin',
    host:'localhost',
    database:'test_db',
    password:'mypassword',
    port:5432
});

const eventData = (req,res) => {
    //res.status(200).json({message:"Hello from server"});

    pool.connect((err,client,release) => {
        if(err){
            return res.status(500).send('Error Connecting to Resources');
        }
        client.query('SELECT * FROM "GuestUser"',(err,result) => {
            release();

            if(err){
                return res.status(500).send('Error Retrieving to Resources');
            }
            let data = new Array();
            for(x in result.rows){
                let date = result.rows[x].Created_At.toString();
                data.push(
                    {
                        account:x,
                        Id:result.rows[x].Id,
                        App:result.rows[x].App,
                        User:result.rows[x].User__c,
                        Image:result.rows[x].Image_Type,
                        Login:result.rows[x].Login_Type,
                        Date: date.split("T")[0]
                    }
                )
            }
            res.status(200).json({message:data});
        })
    })
}

module.exports = eventData;