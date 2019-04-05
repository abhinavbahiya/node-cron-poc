const express = require('express');
const app = express();
const port = process.env.PORT || 2001;
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const myFirstMiddleware = (req, res, next) => {
  console.log('Hi I am in middleware');
  console.log(process.env)
  next();
}

const myFirstController = (req, res) => {
  console.log('I am in controller');
  res.status(200).json('Hi there!');
}

const myCronController = async (req, res) => {
  try {
    let account = await nodemailer.createTestAccount();

    let transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL || account.user,
        pass: process.env.PASSWORD || account.pass
      }
    });

    let mailoptions = {
      from: '"Fred Foo 👻" <foo@example.com>',
      to: 'thepotatofever@example.com',
      subject: 'My first email',
      text: 'Congratulations! The Potato Fever'
    }

    cron.schedule('* * * * * *', async () => {
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
