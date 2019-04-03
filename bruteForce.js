var net = require('net');
var Encryptor = require('./encryptor');
var Decryptor = require('./decryptor');
var PacketList = require('./packetList');

var Muxer = require('port-mux');

var gameserver = new net.Socket();

class BruteForce {
    constructor(gameserver) {
        if (gameserver) {
            this.gameserver = gameserver;
        }

        this.encryptor = new Encryptor();
        this.decryptor = new Decryptor();
        this.packetList = new PacketList();
    }

    sendIndex() {
        var indexPacket = new Buffer.from([0xc1, 0x06, 0x03, 0x00, 0x00, 0x01]);

        this.gameserver.write(indexPacket);
    }
}

var bruteForce = new BruteForce(gameserver);

//gameserver.connect({
//    port: 61485,
//    host: 'localhost',
//    localPort: 61444
//}, function() {
//    console.log('Connected to my Client');
//});

//gameserver.on('data', function(data) {
//    var packet = data.toString('hex');
//
//    if (packet.indexOf(''))
//
//    //BruteForce
//});


var addrRegex = /^(([a-zA-Z\-\.0-9]+):)?(\d+)$/;
var addr = {
    from: addrRegex.exec(process.argv[2]),
    to: addrRegex.exec(process.argv[3])
};
if (!addr.from || !addr.to) {
    console.log('Usage: <from> <to>');
    return;
}
net.createServer(function(from) {
    var to = net.createConnection({
        host: addr.to[2],
        port: addr.to[3]
    });
    from.pipe(to);
    to.pipe(from);
}).listen(addr.from[3], addr.from[2]);
