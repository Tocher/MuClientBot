var pcap = require('pcap'),
    pcap_session = pcap.createSession('en0', "ip proto \\tcp");

var Decryptor = require('./decryptor');
var decryptor = new Decryptor();

var PacketHandler = require('./packetHandler');
var packetHandler = new PacketHandler();

pcap_session.on('packet', function (raw_packet) {
    var packet = pcap.decode.packet(raw_packet);

    var port = packet.payload.payload.payload.dport;
    var sport = packet.payload.payload.payload.sport;
    var data = packet.payload.payload.payload.data;

    // Chat
    // data[0] == 193 && data[2] == 0
    if (port === 44405 || port === 55901 || port === 56900 || port === 55921) {
        if (data) {
            //console.log(data[0], data[1]);
        }

        if (data && data[0] === 195) {
//            console.log('C3');
//            console.log(data.toString('hex'));
            data = decryptor.DecryptC3(data);
        }

        // Chat
        if (data && data[0] === 193) {
            console.log('C1');
            var str = '';
            for (var i = 0; i < data.length; i++) {
                str += hex2(Number(data[i]).toString(16)) + ' ';
            }
            console.log(str);
        }

        if (data && filterPacket(data)) {
            var str = '';
            for (var i = 0; i < data.length; i++) {
                str += hex2(Number(data[i]).toString(16)) + ' ';
            }
            console.log('From Client, to: ' + packet.payload.payload.daddr + ':' + port);
//            console.dir(str);
            var decCl = decryptor.InternalDecrypt32(data);

            if (decCl.toString('hex').indexOf('c10518') > -1) {
                var check = new Buffer.from([0xc1, 0x06, 0x03, 0xff, 0x0b, 0x8e]);
                //pcap_session.inject(check);
            }

            if (decCl.toString('hex').slice(4, 8) == 'f101') {
                console.log('SERIAL:', decCl);
            }

            console.log(decCl.toString('hex'));
//            console.log(
//                decCl[0],
//                decCl[2],
//                decCl[3]
//            );

            console.log('');
        }
    }

    if (sport === 44405 || sport === 55901 || sport === 56900 || sport === 55921) {
        if (data && data[0] === 193) {
//            console.log('serv C1');
            var str = '';
            for (var i = 0; i < data.length; i++) {
                str += hex2(Number(data[i]).toString(16)) + ' ';
            }
//            console.log(str);
        }

        if (data && data[0] === 195) {
//            console.log(data);
            data = decryptor.DecryptC3(data);
        }

        //if (data && filterPacket(data)) {
        if (data && data[2] != 24) {
            var str = '';
            var str2 = '';
            for (var i = 0; i < data.length; i++) {
                str += hex2(Number(data[i]).toString(16)) + ' ';
                str2 += hex2(Number(data[i]).toString(16));
            }
//            console.log('from Server: ' + sport);
//            console.log(
//                str2.slice(0, 2),
//                str2.slice(4, 6),
//                str2.slice(6, 8),
//                str2.slice(8)
//            );
//            console.dir(str);
            var text = hex2a(str2);

            if (str2.indexOf('c116f403') > -1) {
                var port = str2.slice(str2.length - 4),
                    part1 = parseInt(port.slice(0, 2), 16),
                    part2 = parseInt(port.slice(2, 4), 16);

                console.log('IP:', text);
                console.log((part2 << 8) + part1);
            }

            if (str2.indexOf('c12900') > -1) {
                console.log('chat:', data);
            }

            var indexCheck = str2.indexOf('c10603');
            if (indexCheck > -1) {
//                console.log('from Server: ' + sport + ' to: ' + port);
//                console.log(str2.slice(indexCheck, indexCheck + 12));
//                console.log('');
            }
        }
    }
});

function filterPacket(data) {
    var type = data[0],
        size = data[1],
        code = data[2],
        subcode = data[3];

    //if (type == 193 && data[2] == 0xfb) return true;

    // hide server/client pings
    if (type == 195 && code == 24) return false;

//    if (type == 195) {
//        var dataN = decryptor.InternalDecrypt32(data);
//        console.log(dataN[1], dataN[2], dataN[3]);
//    }
    if (type == 193 && size == 5) return true;
    if (type == 193 && code == 3) return true;
    if (type == 195 && code == 3) return true;
    if (type == 195 && code == 241) return true;
    if (type == 195 && code == 255) return true;

    // show checksums
    //if (type == 195) return true;
    //if (type == 195 && code == 3 && subcode == 12) return true;

    return true;
}

function hex2(hex) {
    if (hex.length === 1) {
        return '0' + hex;
    }
    return hex;
}

function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
}
