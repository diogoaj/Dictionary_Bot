'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === process.env.FB_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

// Using the "dicionario-aberto" api
// Not very complete but for now it suffices

var url = "http://dicionario-aberto.net/search-json/"

app.post('/webhook/', function (req, res) {
    var dict = null
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id
        if (event.message && event.message.text) {
            let text = event.message.text
            console.log("Visiting api page -> " + url+text)
            request(url+encodeURI(text), (error, response, body)=> {
            if (!error && response.statusCode === 200) {
              dict = JSON.parse(body)
              if(dict.hasOwnProperty('superEntry')){
                dict = dict.superEntry[0].entry.sense[0].def    
              }else{
                dict = dict.entry.sense[0].def
              }
                 
              dict = dict.replace(/<br ?\/?>/g, "\r\n")
              sendTextMessage(sender, dict)
              console.log("Got a response: ")
              console.log("Dict entry: "+dict)   
            } else {
              dict = "Essa palavra não está no meu dicionário!"
              sendTextMessage(sender, dict)
              console.log("Got an error: ", error, ", status code: ", response.statusCode)
            }
          })          
        }
    }
    res.sendStatus(200)
})

const token = process.env.FB_PAGE_TOKEN

function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}