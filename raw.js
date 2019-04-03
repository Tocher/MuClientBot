var net = require('net');

var Decryptor = require('./decryptor');
var decryptor = new Decryptor();

var LOCAL_PORT  = 44405;
var LOCAL_PORT_GS  = 55901;
var REMOTE_PORT = 44405;
var REMOTE_PORT_GS = 55901;
var REMOTE_ADDR = "173.212.240.106";

var localIp = '178.154.163.76';

var epochMu = '137.74.58.106';

function stringToBuffer(name, size) {
    size = size || 10;

    var nameInHex = name.hexEncode();
    var charname = Buffer.alloc(size);
    nameInHex.forEach(function(e, i) {
        charname[i] = e;
    });

    return charname;
}

//console.log(stringToBuffer('178.154.163.76', 16).toString('hex'));

var ipPacket = new Buffer.from('c116f4033137382e3135342e3136332e373600005dda', 'hex');
//var ipPacket = new Buffer.from('c116f403 3137332e3231322e3234302e31303600 5dda';

function EncryptCheckSumKey(wSource) {
    var wRandom = Math.floor(Math.random()*64);
    var wAcc = ((wSource & 0x3F0) * 64) | (wRandom *16) | (wSource & 0x0F);
    return wAcc ^ 0xB479;
}

var server = net.createServer(function (socket) {
    console.log('client connected');

    var serviceSocket = new net.Socket();
    serviceSocket.connect(parseInt(REMOTE_PORT), REMOTE_ADDR, function () {
        console.log('>> Connect to MuEvo');
    });

    serviceSocket.on("data", function (data) {
        console.log('>> From proxy to client', data.toString());
        if (data.toString('hex').indexOf('c116f403') > -1) {
            console.log('CATCH');
            console.log(data);
            console.log(ipPacket);
            socket.write(ipPacket);
        } else {
            socket.write(data);
        }
    });

    socket.on('data', function (msg) {
        console.log('  ** START **');
        console.log('<< From client to proxy ', msg.toString());
        serviceSocket.write(msg);
    });
});

var globalIndex = 0;
function sendServerCheckSum(socket) {
    //var hex = Number(EncryptCheckSumKey(globalIndex)).toString(16);
    var part2;
    if (globalIndex < 16) {
        part2 = new Buffer.from('0' + globalIndex.toString(16), 'hex');
    } else {
        part2 = new Buffer.from(globalIndex.toString(16), 'hex');
    }

//    console.log(part2);

    var checkPack = Buffer.concat([
//        Buffer([0xc1,0x06,0x03,0x00]),
        Buffer([0xc1,0x06,0x03,0xff]),
//        Buffer([0x1d, 0x28])
//        Buffer(hex, 'hex')
        Buffer([0x00]),
        part2
    ]);
//    console.log('write');
    console.log('send index:', globalIndex, checkPack);
    socket.write(checkPack);
}

var startTable = false;

// sub - ff
// 0f 23 -> c3 08 03 0c 98 74 c0 62

// sub - 00
var server2 = net.createServer(function (socket) {
    console.log('connected TO GAMESERVER!');

    var gameServer = new net.Socket();
    gameServer.connect(parseInt(REMOTE_PORT_GS), REMOTE_ADDR, function () {
        console.log('>> Connect to GS');
    });

    gameServer.on("data", function (data) {
        //console.log('>> From proxy GS to client', data.toString());
        if(data.toString('hex').indexOf('c10603') > -1) {
//            console.log('checksum!', data.toString('hex'));

            setTimeout(function() {
                console.log('start:');
                startTable = true;

//                sendServerCheckSum(socket);

//                var index = 200;
//                var id = setInterval(function() {
//                    if (index === 1023) {
//                        clearInterval(id);
//                        console.log('DONE');
//                    }
//
//                    index++;
//                }, 200);
            }, 2000);
        }
        socket.write(data);
    });

    socket.on('data', function (data) {
        var decData = data,
            checks = false;
        if (data && data[0] === 195) {
            decData = decryptor.DecryptC3(decData);
            if (decData[2] == 0x03) {
                checks = true;
//                console.log(globalIndex, decData);
//                console.log(data);
                //c3 08 03 0c eb 23 4a 93

//                1004 <Buffer c3 08 03 0c eb 23 4a 93>
//                <Buffer c3 0d e4 0d 4a f4 5f 56 10 75 ed 24 1e>

                if (startTable) {
                    console.log(globalIndex, decData);
                    globalIndex++;
                    setTimeout(function() {
                        sendServerCheckSum(socket);
                    }, 300);
                }
            }
        }

        if (checks && startTable) return;

        //console.log('  ** START **');
        //console.log('<< From client to proxy ', msg.toString());
        gameServer.write(data);
    });
});

server.listen(LOCAL_PORT);
server2.listen(LOCAL_PORT_GS);
console.log("TCP server accepting connection on port: " + LOCAL_PORT);
