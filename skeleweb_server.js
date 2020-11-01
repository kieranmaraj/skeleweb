const express = require("express");// use express to serve up the UI page
const app = express();
const http = require("http").Server(app);// Socket.IO uses a http server
const io = require("socket.io")(http);

const PORT = 8090;

console.log("what")

// Server needs to handle connections from 4 types of patches, 2 pairs of broadcasters and receivers
//
// PAIR #1
// Skeletime Data Broadcast patch - sends pose+hands data as a JSON object - received by this server - there should only be one connected broadcast patch
// Skeletime Parse Receive patch  - the server sends JSON data received from the broadcaster patch to any number of Parse receiver patches
//
// PAIR #2
// Skeletime Classify Broadcast patch - sends the currently detected gesture to the server, only one classify patch at a time
// Skeletime Class Receiver patch     - any number of class receivers can receive the currently detected gesture from the class broadcaster

let data_broadcast = false;
let skeletime_data;

let classify_broadcast = false;
let classify_data;

app.get('/', (req, res) => {
    res.render(__dirname + '/index.html');
});

io.on("connection", function(socket){
    socket.emit("getType");

    socket.on("assignType", (type)=>{
        console.log("received type: " + type);

        if(type==="data_broadcast"){
            if(!data_broadcast){
                data_broadcast = true;
                socket.type = type;

                console.log("Data Broadcaster connected")
            }
        }else if(type==="classify_broadcast"){
            if(!classify_broadcast){
                classify_broadcast = true;
                socket.type = type;
                
                console.log("Classifier Broadcaster connected");
            }
        }else{
            
            socket.type = type;

            console.log(`Received connection: ${type}`);
        }
    });

    socket.on("rawData", (data)=>{
        skeletime_data = data;
        console.log("skeletime", skeletime_data);

        io.sockets.clients((error, clients)=>{
            if(error) throw error;
            for(let i = 0; i < clients.length; i++){
                if(io.sockets.connected[clients[i]].type === 'data_receiver'){
                    // socket.emit("rawData", data);
                    io.sockets.connected[clients[i]].emit('rawData', data);
                }
            }
        })
    });

    socket.on("classificationData", (data)=>{
        classify_data = data;
        console.log("classification", classify_data);
    });

    socket.on("disconnect", function(){
        if(socket.type === 'data_broadcast'){
            data_broadcast = false;
        }else if(socket.type === 'classify_broadcast'){
            classify_broadcast = false;
        }
    })





})


http.listen(PORT, function () {
	console.log("listening on *:" + PORT);
});
