const express = require('express');
const app = express();
const port = process.env.PORT || 2001;
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const moment = require('moment');
const AWS = require('aws-sdk');

const myFirstMiddleware = (req, res, next) => {
  console.log('Hi I am in middleware');
  next();
}

const myFirstController = (req, res) => {
  console.log('I am in controller');
  res.status(200).json('Hi there!');
}

const getEmails = (time) => {
  let emailIds = [];
  AWS.config.update({
    region: "us-west-2",
    endpoint: "http://localhost:8000"
  });

  let docClient = new AWS.DynamoDB.DocumentClient();

  var TableName = "Information"; // Name of the table

  var params = {
    TableName, // Use of shorthand
    Key: {
      "time": time
    }
  };

  docClient.get(params, function (err, data) {
    if (err) {
      console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
      emailIds = data;
    }
  });
  return emailIds;
}

const myCronController = async (req, res) => {
  try {
    let transporter = nodemailer.createTransport({
      host: 'gmail',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD // Environment Variable's aren't pushed to source control
      }
    });
    let time = moment.normalizeUnits('UTC').format().split('T')[1].split(':');
    time = time[0].toString() + time[1].toString();
    let emailIds = getEmails(time);

    let emailString = emailIds.join(', '); // Comma & space

    let mailoptions = {
      from: 'abhinavbahiya@gmail.com',
      to: emailString,
      subject: 'My first email',
      text: `Congratulations! You've been emailed at 8 am of your local time.`
    }

    cron.schedule('*/30 * * * *', async () => { // Runs cron job in every 30 minutes
      console.log("Running something");
      let info = await transporter.sendMail(mailoptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Successfuly Sent!");
        }
      })
      console.log('Message sent %s', info.messageId);
      console.log('Preview URL %s', nodemailer.getTestMessageUrl(info));

    });

  } catch (err) {
    console.log("Some error", err)
  }
}


app.delete('/', myFirstController);

app.use(myFirstMiddleware);

app.get('/', myFirstController);
app.post('/', myCronController);


app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`)
})
