/**
 * name : pushcompletedsubmissions.js
 * author : Saish Borkar
 * created-date : 18-JULY-2024
 * Description : Migration script to push completed survey submissions to kafka
 */

const path = require("path");
let rootPath = path.join(__dirname, '../../')
require('dotenv').config({ path: rootPath+'/.env' })
require("../../config/globalVariable")();

let _ = require("lodash");
let mongoUrl = process.env.MONGODB_URL;

let dbName = mongoUrl.split("/").pop();
let url = mongoUrl.split(dbName)[0];
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
const args = process.argv.slice(2);

let surveySubmissionsControllerClass = require('../../controllers/v1/surveySubmissionsController');
let surveySubmissionsControllerInstance = new surveySubmissionsControllerClass;

let ID = args[0];

(async () => {

    let connection = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    let db = connection.db(dbName);

    try {
        // if it is a solution id
      let surveySubmissionsRecords = await db
        .collection("surveySubmissions")
        .find({solutionId:ObjectId(ID),status:"completed"})
        .toArray();   
      
      if(surveySubmissionsRecords && surveySubmissionsRecords.length > 0)
      {


        let chunkOfsurveySubmissionsRecords = _.chunk(surveySubmissionsRecords, 10);

        for(let i=0;i<chunkOfsurveySubmissionsRecords.length;i++){

            let currentBatch = chunkOfsurveySubmissionsRecords[i];

                for(let j=0;j<currentBatch.length;j++){

                    try{
                        let pushAction = await surveySubmissionsControllerInstance.pushCompletedSurveySubmissionInKafka({
                            params:{
                                _id:currentBatch[0]._id
                            }
                        })
                        
                    }catch(err){
                        console.log(err,'Error caught')
                    }

                }

        }


      }else {
        // if it is a submission id
        let surveySubmissionsRecordsSingle = await db
        .collection("surveySubmissions")
        .findOne({_id:ObjectId(ID),status:"completed"})
        
        if(!surveySubmissionsRecordsSingle)
        {
            throw new Error("No record found with that submission id")
        }

        try{
            let pushAction = await surveySubmissionsControllerInstance.pushCompletedSurveySubmissionInKafka({
                params:{
                    _id:surveySubmissionsRecordsSingle._id
                }
            })
         
        }catch(err){
            console.log(err,'Error caught')
        }



      }

      console.log("completed");
      connection.close();
    }
    catch (error) {
        console.log(error)
    }
})().catch(err => console.error(err));
