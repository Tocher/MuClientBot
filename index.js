var net = require('net');

var client = new net.Socket();
var global = {};

client.on('data', function(data) {
    console.log('Received: ' + data.toString('hex'));

    var packetFromServer = data.toString('hex'),
        packets = {
            getServerList: new Buffer([0xc1, 0x04, 0xF4, 0x06]),
            getServerInfo: new Buffer([0xc1, 0x05, 0xF4, 0x03, 0x00]),
            login: new Buffer([0xc3, 0x00, 0xF1, 0x01])
        };

    // hello packet
    if (packetFromServer === 'c1040001' || packetFromServer === 'c105000100') {
        console.log('получили hello от сервер');
        console.log('запрашиваем список серверов');

        client.write(packets.getServerList);
    } else {
        var packetId = packetFromServer[0] + packetFromServer[1],
            packetSize, packetCode, packetSubcode;

        switch (packetId) {
            case 'c1':
                packetSize = packetFromServer.slice(2, 4);
                packetCode = packetFromServer.slice(4, 6);
                packetSubcode = packetFromServer.slice(6, 8);

                // Инфо сервера
                if (packetCode === 'f4' && packetSubcode === '03') {
                    let packetData = packetFromServer.substr(8);

                    var ip = hex2a(packetData.substr(0, packetData.length - 4));
                    // последние 4 байта, хз что (71da) в хексе

                    console.log(ip);

                    client.write(packets.login);
                }

                break;
            case 'c2':
                packetSize = packetFromServer.slice(2, 6);
                packetCode = packetFromServer.slice(6, 8);
                packetSubcode = packetFromServer.slice(8, 10);

                // Список серверов
                if (packetCode === 'f4' && packetSubcode === '06') {
                    global.servers = [];

                    var serverCount = parseInt(packetFromServer.slice(10, 14), 16);

                    console.log('Server List:');
                    console.log('count: ', serverCount);
                    console.log('');

                    for (var i = 0; i < serverCount; i++) {
                        var index = 14 + i * 8;
                        var serverInfo = packetFromServer.slice(index, index + 8),
                            playersCount = parseInt(serverInfo.slice(2, 6), 16),
                            maxPlayersCount = parseInt(serverInfo.slice(6, 8), 16);

                        console.log('Server ID: ', serverInfo.slice(0, 2));
                        console.log('Server load: ', playersCount);
                        console.log('Server max: ', maxPlayersCount);
                        console.log('');

                        global.servers.push({
                            id: serverInfo.slice(0, 2),
                            load: serverInfo.slice(2, 6),
                            max: serverInfo.slice(6, 8)
                        });
                    }

                    // get server info
                    packets.getServerInfo[4] = global.servers[0].id;
                    console.log('Send: ', packets.getServerInfo);
                    client.write(packets.getServerInfo);
                }

                break;
        }
    }

    //const buf = new Buffer([0xc1, 0x04, 0xF1, 0x0E]);
    //const buf = new Buffer([0xc1, 0x04, 0xF4, 0x06]);
    //const buf2 = new Buffer([0xc1, 0x08, 0xf4, 0x3d, 0x80, 0x04, 0x00, 0x00]);
    // const buf = new Buffer([0xc1, 0x06, 0x05, 0x01, 0x04, 0x03]);
});

client.on('close', function() {
    console.log('Connection closed');
});

client.on('uncaughtException', function(err) {
    console.log(err);
});

function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

function InternalEncrypt(startOffset, data) {
    var newStr = '';

    for (var i = 0; i < data.length - startOffset; i++) {
        newStr += String.fromCharCode(data.charCodeAt(i + startOffset) ^ Xor3Keys[i % 3]);
    }

    return newStr;
}

const Xor3Keys = [0xFC, 0xCF, 0xAB];
const Xor32Key = [0xAB, 0x11, 0xCD, 0xFE, 0x18, 0x23, 0xC5, 0xA3,
    0xCA, 0x33, 0xC1, 0xCC, 0x66, 0x67, 0x21, 0xF3,
    0x32, 0x12, 0x15, 0x35, 0x29, 0xFF, 0xFE, 0x1D,
    0x44, 0xEF, 0xCD, 0x41, 0x26, 0x3C, 0x4E, 0x4D];

var localIp = '10.211.55.5';
var ip = '37.233.54.84'; // legendOfMu там другой протокол
var ip2 = '178.124.144.169'; // mu-stels.ru

client.connect(44405, ip2, function() {
    console.log('Connected');
});
