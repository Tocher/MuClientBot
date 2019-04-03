var net = require('net');
var os = require('os');

var Encryptor = require('./encryptor');
var Decryptor = require('./decryptor');
var PacketHandler = require('./packetHandler');
var PacketList = require('./packetList');

var client = new net.Socket();
var gameserver = new net.Socket();
var gameserver2 = new net.Socket();
var global = {};


var encryptor = new Encryptor();
var decryptor = new Decryptor();

var packetHandler = new PacketHandler(gameserver2);
var packetList = new PacketList();

//pings
var a1 = 'c3,18,85,1b,70,3c,a7,5,80,d,10,d8,ed,a9,3e,a,9c,9b,4f,f0,1b,98,2f,11';
var a2 = 'c3,18,d3,8c,76,dd,f,31,30,dc,a4,6d,58,7e,be,7b,1f,c0,cb,b3,97,ac,a9,97';
var a3 = 'c3,18,ff,44,44,6,2b,7f,1,54,2d,1e,2b,f6,44,73,3f,5e,88,f0,83,18,b0,8e';

// c3 05 f1 fc cd
var a4 = 'c3,d,4,b4,72,5d,cb,e8,b0,b9,2d,34,d';

// checksum?
// c3 08 03 0c  57 60 88 67
var a5 = 'c3,d,88,81,74,1d,e,5e,b1,66,38,2a,10';
// c3 08 03 0c  fe 53 d1 f8
var a6 = 'c3,d,5e,45,59,97,6e,66,d1,af,20,f5,cf';
// c3 05 f1 fc ce
var a7 = 'c3,d,40,b1,3c,bf,da,24,10,42,45,46,7f';

//var nameInXor = new Buffer.from([0xbb, 0x24, 0x74, 0xae, 0x34, 0x27, 0x71, 0xdd, 0xac, 0x2f]);
//
//var name = decryptor.InternalDecrypt32(nameInXor);
//console.log(name.toString('hex'));

//console.log(decryptor.InternalEncrypt(nameInXor, 0).toString());

//var list = new Buffer.from([0xc1, 0x0e, 0xf3, 0xe9, 0xbb, 0x24, 0x74, 0xae, 0x34, 0x27, 0x71, 0xdd, 0xac, 0x2f]);
////var list = decryptor.InternalEncrypt32(packetList.selectChar('aaaa'));
//list = decryptor.InternalDecrypt32(list);
//console.log(list);


//var loginInHex2 = 'aaaa'.hexEncode();
//var charName = Buffer.alloc(10);
//loginInHex2.forEach(function(e, i) {
//    charName[i] = e;
//});
//
//console.log(decryptor.InternalEncrypt(charName, 0));



function preparePacket(packet) {
    return packet.split(',').map(function(e) {
        return parseInt(e, 16);
    });
}

//var test = new Buffer.from(preparePacket(a3), 'hex');
//
//var dec = decryptor.DecryptC3(test);
//console.log(dec);



//var checksumHeader = [
//    0xc3, 0x00, 0x03, 0x00
//];
//var tickCount = os.uptime() * 1000; // in milliseconds
//
//var checksubRequest = Buffer.concat([
//    Buffer.from(checksumHeader),
//    Buffer(tickCount.toString(16), 'hex')
//]);
//checksubRequest[1] = checksubRequest.length;
//
//var encLoginPacket = encryptor.InternalEncrypt32(checksubRequest);
//var encFinalLoginPacket = encryptor.EncryptC3(encLoginPacket);
//console.log(encFinalLoginPacket);


var evoMu = '173.212.240.106';
var localIp = '10.211.55.5';
var ip = '37.233.54.84'; // legendOfMu там другой протокол
var ip2 = '178.124.144.169'; // mu-stels.ru // port 55921
var megaMu = '144.76.110.213'; // megamu.ru // port 55901

//var finalMu = '91.134.175.57';
var goldMu = '151.80.28.49'; // 151.80.28.49:56900
var epochMu = '137.74.58.106';

client.connect(44405, evoMu, function() {
    console.log('Connected');
});

//gameserver2.connect(56900, goldMu, function() {
//    console.log('Connected to GameServer');
//});

gameserver2.on('data', function(data) {
    console.log(data.toString('hex'));
    packetHandler.addServerPacket(data.toString('hex'));
});


var prevPart;
gameserver.on('data', function(data) {

    var packetFromServer = data.toString('hex'),
        packets = {
            getCharacterList: new Buffer.from([0xc1, 0x04, 0xF3, 0xfc]),
            // 'c1 0e f3 e9 94 0b 57 89 13 00 56 fa 8b 08' acc:tocher2 char:Name
            // 'c1 0e f3 e9 bb 24 74 ae 34 27 71 dd ac 2f' acc:tocher  char:aaaa
            selectChar: new Buffer.from([0xc1, 0x0e, 0xf3, 0x03, 0x61, 0x61, 0x61, 0x61, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
            selectFirstChar: new Buffer.from([0xc1, 0x0e, 0xf3, 0xe9, 0xbb, 0x24, 0x74, 0xae, 0x34, 0x27, 0x71, 0xdd, 0xac, 0x2f]),
            // 'c1 0e f3 ff 82 1d 41 9f 05 16 40 ec 9d 1e'
            // 'c1 0e f3 ff ad 32 62 b8 22 31 67 cb ba 39'
            enterInWorld: new Buffer.from([0xc1, 0x0e, 0xf3, 0xff, 0xad, 0x32, 0x62, 0xb8, 0x22, 0x31, 0x67, 0xcb, 0xba, 0x39]),
            checksum: new Buffer.from([0xc3, 0x08, 0x03, 0x0c, 0xfe, 0x53, 0xd1, 0xf8])
        };

    if (prevPart) {
        packetFromServer = prevPart + packetFromServer;
    }

    // 'c3 0d 5e 45 59 97 6e 66 d1 af 20 f5 cf '

    // Animation
    // 14 - Rotation (https://github.com/MUnique/OpenMU/blob/master/src/GameLogic/DirectionExtensions.cs)
    // 5d - Animation
    // 'c1 05 18 14 5d '


    var packetType = packetFromServer.slice(0, 2);
    var packetSize = packetFromServer.slice(2, 4);
    var packetCode = packetFromServer.slice(4, 6);
    var packetSubcode = packetFromServer.slice(6, 8);
    var sizeInt = parseInt(packetSize, 16) * 2;
    var packetContent = packetFromServer.slice(8, sizeInt);

    console.log('GS: ' + packetType + ' size:' + packetSize + ' code:' + packetCode + ' subtype:' + packetSubcode);
    console.log('data: ',packetContent);

    // TODO: склеивать пакеты и обрабатывать только когда получен весь кусок.
    console.log('HOHO', packetFromServer.slice(sizeInt));

    // Server Info
    // Success / Player-ID / Version (c10cf10001384f3130343034)
    if (packetType === 'c1' && packetCode === 'f1' && packetSubcode === '00') {
        var success = packetFromServer.slice(8, 10);
        var playerId = packetFromServer.slice(10, 14);
        var version = packetFromServer.slice(14);

        console.log('Get login dialog: ', success === '01' ? 'success' : 'unknown');
        console.log('Player Id: ', playerId);
        console.log('Version: ', version);

        var loginRequestHeader = [
            0xc3, 0x00, 0xf1, 0x01
        ];
        var clientVersion = [0x31, 0x30, 0x34, 0x30, 0x34]; // 1.04.04
        var clientSerial = 'k1Pk2jcET48mxL3b'; // 16 length!
        var tickCount = os.uptime() * 1000; // in milliseconds

        var loginInHex = 'tocher'.hexEncode();
        var username = Buffer.alloc(10);
        loginInHex.forEach(function(e, i) {
            username[i] = e;
        });

        var passInHex = 'tocher'.hexEncode();
        var password = Buffer.alloc(20);
        passInHex.forEach(function(e, i) {
            password[i] = e;
        });

        var loginRequest = Buffer.concat([
            Buffer.from(loginRequestHeader),
            encryptor.InternalEncrypt(username, 0),  // Xor3
            encryptor.InternalEncrypt(password, 0),  // Xor3
            Buffer.from(tickCount.toString(16), 'hex'),
            Buffer.from(clientVersion),
            Buffer.from(clientSerial.hexEncode())
        ]);
        loginRequest[1] = loginRequest.length;

        var encLoginPacket = encryptor.InternalEncrypt32(loginRequest);
        var encFinalLoginPacket = encryptor.EncryptC3(encLoginPacket);

        //decryptLogin(encFinalLoginPacket);
        //console.log(encFinalLoginPacket.toString('hex'));
        gameserver.write(encFinalLoginPacket);
    }

    if (packetCode === '0d' && packetSubcode === '01') {
        console.log(hex2a(packetContent));

        gameserver.write(packets.getCharacterList);
    }

    // Result of the login process
    if (packetType === 'c1' && packetCode === 'f1' && packetSubcode === '01') {
        if (packetContent === '01') {
            console.log('Login Success');
        } else {
            console.log('Login error: ', packetContent);
        }
    }

    // after get char List (select char)
    if (packetType === 'c1' && packetCode === 'fb' && packetSubcode === '53') {
        gameserver.write(packets.selectFirstChar);
    }
    // after select char server return Name
    if (packetType === 'c1' && packetCode === 'f3' && packetSubcode === '15') {

        console.log('Char name: ', hex2a(packetContent));
        gameserver.write(packets.enterInWorld);
        gameserver.write(packets.checksum);
    }

    console.log('');
});

client.on('data', function(data) {
    console.log('Received: ' + data.toString('hex'));

    var packetFromServer = data.toString('hex'),
        packets = {
            getServerList: new Buffer.from([0xc1, 0x04, 0xF4, 0x06]),
            getServerInfo: new Buffer.from([0xc1, 0x05, 0xF4, 0x03, 0x00]),
            getServerInfo2: new Buffer.from([0xc1, 0x06, 0xF4, 0x03, 0x00, 0x00]),
            login: new Buffer.from([0xc3, 0x00, 0xF1, 0x01]),
            logout: new Buffer.from([0xc3, 0x00, 0xF1, 0x02]),
            chat: new Buffer.from([0xC1, 0x0D, 0x00, 0xAB, 0xCD, 0xEF, 0x12, 0x34, 0x56, 0x78, 0x90, 0xA1, 0xA2])
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
                    var packetData = packetFromServer.substr(8);

                    var ip = hex2a(packetData.substr(0, packetData.length - 4));
                    var port = packetData.substr(packetData.length - 4);
                    // последние 4 байта, хз что (71da) в хексе

                    console.log(ip);
                    console.log(port);


                    var loginRequestHeader = [
                        0xc3, 0x00, 0xf1, 0x01
                    ];
                    var clientVersion = [0x31, 0x30, 0x34, 0x30, 0x34]; // 1.04.04
                    var clientSerial = 'k1Pk2jcET48mxL3b'; // 16 length!
                    var tickCount = os.uptime() * 1000; // in milliseconds

                    var loginInHex = 'tocher'.hexEncode();
                    var username = Buffer.alloc(10);
                    loginInHex.forEach(function(e, i) {
                        username[i] = e;
                    });

                    var passInHex = 'tocher'.hexEncode();
                    var password = Buffer.alloc(20);
                    passInHex.forEach(function(e, i) {
                        password[i] = e;
                    });

                    var loginRequest = Buffer.concat([
                        Buffer.from(loginRequestHeader),
                        encryptor.InternalEncrypt(username, 0),  // Xor3
                        encryptor.InternalEncrypt(password, 0),  // Xor3
                        Buffer.from(tickCount.toString(16), 'hex'),
                        Buffer.from(clientVersion),
                        Buffer.from(clientSerial.hexEncode())
                    ]);
                    loginRequest[1] = loginRequest.length;

                    var encLoginPacket = encryptor.InternalEncrypt32(loginRequest);
                    var encFinalLoginPacket = encryptor.EncryptC3(encLoginPacket);

                    //gameserver.write(encFinalLoginPacket);

                    // version 1.04.30
                    //Hex:3232373735
                    //Ascii:22775
                }

                // Инфо сервера (окно входа)
                if (packetCode === 'f4' && packetSubcode === '00') {
                    var packetData = packetFromServer.substr(8);

                    console.log('Success: ', packetData.slice(0, 2));
                    console.log('PlayerId: ', packetData.slice(2, 6));
                    console.log('Version: ', packetData.slice(6));
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
            case 'c3':
                var decryptedData = InternalDecrypt32(Decrypt(packetFromServer));
                console.log(dec2.toString('hex'));

                console.log(toHex(dec2[0]));
                console.log(toHex(dec2[1]), 'size');
                console.log(toHex(dec2[2]), 'code');
                console.log(toHex(dec2[3]), 'subcode');

                break;
        }
    }

    //const buf = new Buffer.from([0xc1, 0x04, 0xF1, 0x0E]);
    //const buf = new Buffer.from([0xc1, 0x04, 0xF4, 0x06]);
    //const buf2 = new Buffer.from([0xc1, 0x08, 0xf4, 0x3d, 0x80, 0x04, 0x00, 0x00]);
    // const buf = new Buffer.from([0xc1, 0x06, 0x05, 0x01, 0x04, 0x03]);
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
    for (var i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
}

//console.log(CopyIntToArray(128079, 0, 4));

//console.log(new Buffer.from([128079, 164742, 70235, 106898]));
//var key = new Buffer.from(Xor32Key);
//console.log(key.length);
//console.log(key.readUInt16LE());
//console.log(key.readUInt16LE(8));
//console.log(key.readUInt16LE(16));
//console.log(key.readUInt16LE(24));

//console.log(key.slice(0, 8));
//console.log(CopyArrayToInt(key.slice(0, 8)));

const Xor32KeyIn32 = [
    0x54AD000F, 0x33FE31BB, 0x9A1356AC, 0x7183602B,
    0x1347BF28, 0xE9007F10, 0x6F3265F6, 0x921DD3EF
];

var header = [0x12, 0x11, 0x36, 0x00, 0x00, 0x00];
// Enc1.dat
var mod_key = new Buffer.from([
    0xd4, 0x53, 0x09, 0x3f,
    0x01, 0x41, 0x5e, 0xe2,
    0xe2, 0x68, 0xd3, 0x93,
    0x2d, 0x06, 0xdf, 0x20
]);
//var mod_key = new Buffer.from('d453093f01415ee2e268d3932d06df20', 'hex');
var enc_key = new Buffer.from([
    0x5a, 0xfc, 0x08, 0x3f,
    0x00, 0xec, 0x5c, 0xe2,
    0xd1, 0x37, 0xd2, 0x93,
    0xf0, 0x92, 0xde, 0x20
]);
var xor_key = new Buffer.from([
    0x86, 0x1a, 0x08, 0x3f,
    0xd2, 0x76, 0x5c, 0xe2,
    0xfa, 0x41, 0xd2, 0x93,
    0x86, 0x35, 0xde, 0x20
]);


var key1 = new Buffer.from([
    0xd4, 0x53, 0x09, 0x3f,
    0x01, 0x41, 0x5e, 0xe2,
    0xe2, 0x68, 0xd3, 0x93,
    0x2d, 0x06, 0xdf, 0x20
]);
var key2 = new Buffer.from([
    0x5a, 0xfc, 0x08, 0x3f, 0x00, 0xec, 0x5c, 0xe2, 0xd1, 0x37, 0xd2, 0x93, 0xf0, 0x92, 0xde, 0x20
]);
var key3 = new Buffer.from([
    0x86, 0x1a, 0x08, 0x3f, 0xd2, 0x76, 0x5c, 0xe2, 0xfa, 0x41, 0xd2, 0x93, 0x86, 0x35, 0xde, 0x20
]);

function fromEncToBuf(data) {
    data = data.replace(/ /g, '');
    var str='';
    for (var i=0;i<data.length;i+=2) {
        str +='0x'+data[i]+data[i+1]+', ';
    }
    return str.slice(0, str.length-2);
}

// Для enc/dec ключей из файла
//
//var encryptionKeys = new Uint32Array([0x3F08A79B, 0xE25CC287, 0x93D27AB9, 0x20DEA7BF]);
//var key1 = new Uint32Array([0xd453093f, 0x01415ee2, 0xe268d393, 0x2d06df20]);
//var key2 = new Uint32Array([0x5afc083f, 0x00ec5ce2, 0xd137d293, 0xf092de20]);
//var key3 = new Uint32Array([0x861a083f, 0xd2765ce2, 0xfa41d293, 0x8635de20]);

//console.log(fromEncToBuf('861a 083f d276 5ce2 fa41 d293 8635 de20 '));

//console.log(key1.readUInt32LE() ^ encryptionKeys[0]);
//console.log(key1.readUInt32LE(4) ^ encryptionKeys[1]);
//console.log(key1.readUInt32LE(8) ^ encryptionKeys[2]);
//console.log(key1.readUInt32LE(12) ^ encryptionKeys[3]);
//
//console.log(key2.readUInt32LE() ^ encryptionKeys[0]);
//console.log(key2.readUInt32LE(4) ^ encryptionKeys[1]);
//console.log(key2.readUInt32LE(8) ^ encryptionKeys[2]);
//console.log(key2.readUInt32LE(12) ^ encryptionKeys[3]);
//
//console.log(key3.readUInt32LE() ^ encryptionKeys[0]);
//console.log(key3.readUInt32LE(4) ^ encryptionKeys[1]);
//console.log(key3.readUInt32LE(8) ^ encryptionKeys[2]);
//console.log(key3.readUInt32LE(12) ^ encryptionKeys[3]);

// Open Mu enc1.data
var client_mod_key = new Uint32Array([128079, 164742, 70235, 106898]);
var client_enc_key = new Uint32Array([23489, 11911, 19816, 13647]);
var client_xor_key = new Uint32Array([48413, 46165, 15171, 37433]);

// Server keys
var server_mod_key = new Uint32Array([73326, 109989, 98843, 171058]);
var server_enc_key = new Uint32Array([13169, 19036, 35482, 29587]);
var server_xor_key = new Uint32Array([62004, 64409, 35374, 64599]);

// ENC server
// 73326, 109989, 98843, 171058, 13169, 19036, 35482, 29587, 62004, 64409, 35374, 64599
// ENC client
// 128079, 164742, 70235, 106898, 23489, 11911, 19816, 13647, 48413, 46165, 15171, 37433
// DEC server
// 128079, 164742, 70235, 106898, 31544, 2047, 57011, 10183, 48413, 46165, 15171, 37433
// DEC client
// 73326, 109989, 98843, 171058, 18035, 30340, 24701, 11141, 62004, 64409, 35374, 64599




//var packet2 = "w7kxFgK8hYpGGLgdXe7ZpTZViB+r3sRI3YSqZs7/Mh5Vmh2mXqs+3dqkvURmXrL57ASs+FkJz/236Tl9ER67R+WZyMLRMkeLF6tEBiB/4X7SsXrKUznES8of73RxwMy76HZezJbvJ7m9IOGuxcjcNwe6q1+k8fOs1Hz3sULSGlbfiB6qIBXo4onADTNYFoYCQrdtthVsF/aDsvcZ93V36gaKzzyqMhby0sjV4+TAU7719W6LZWNAcnA=";
//var expected = "w/+eRi3xwRp1LdEdKA9lEFFECgL0vYm8siQHloDxwRXsKx4SdRNuBxgl3W3N+OcgJy/dTaThrSAVUhV1XkPLtCklDzoX4gjPXGPjVEJIfb0iY+wGCIFSZnZDKvYIh8GIF7CNZlOLxigIGPESgPY2Ax6WBoTZaDexFePWS8Q1i0Phk5XkZ1LqTRG5gwwxvCZzRi04HVRMTleEnUN2IOIF79s2xr8BXWhsbTIUx30ychj0wdeeAz8D2DCFUUdyB6kWoMG/4V7Mu44JrgM3mfiD0py6j145biJC/BDr9Ii9AsEokQX15FptGi+9/C64i7EBH7QPOm69cdjeNFBQPpms";

//console.log('TEST');
//console.log(new Buffer.from(packet2, 'base64').length);
//EncryptC3(new Buffer.from(packet2, 'base64'));

var packet = new Buffer.from([
    195,90,95,25,7,50,73,204,118,91,236,78,123,151,18,2,20,88,178,147,188,245,142,187,211,234,51,225,197,249,177,109,12,185,140,26,157,25,205,24,199,224,129,57,217,236,193,29,115,160,143,118,112,185,76,243,198,175,191,1,218,90,131,230,176,32,157,168,25,28,75,177,218,136,161,0,156,219,238,207,146,113,14,10,250,180,118,89,173,147
]);

var packet2 = new Buffer.from([
    195,24,199,130,33,198,99,186,241,84,12,97,84,6,224,33,217,79,142,34,25,224,25,39
]);

var loginRequestFromClient = new Buffer.from([
    195,90,95,25,7,50,73,204,118,91,236,78,123,151,18,2,20,88,178,147,188,245,142,187,211,234,51,225,197,249,177,109,12,185,140,26,157,25,205,24,199,224,129,57,217,236,88,150,87,110,147,33,195,160,109,107,94,234,181,89,122,132,221,161,84,189,157,168,98,232,64,95,0,176,225,38,93,219,238,102,130,19,249,84,24,146,76,232,174,144
]);

var unknown1 = new Buffer.from([
    0xc3, 0x18, 0x01, 0x89, 0x26, 0xeb, 0x89, 0x29, 0x73, 0x97, 0x88, 0xc6, 0xf3, 0xd1, 0x67, 0x53, 0x2b, 0xc8, 0xe2, 0x93, 0x64, 0x30, 0xda, 0xe4
]);

var unknown2 = new Buffer.from([
    0xc3, 0x5a, 0x3b, 0x66, 0x10, 0xfb, 0x0a, 0x6a, 0x61, 0x52, 0x70, 0x4f, 0x7a, 0x97, 0x12, 0x02, 0x14, 0x58, 0xb2, 0x93, 0xbc, 0xf5, 0x8e, 0xbb, 0xd3, 0xea, 0x33, 0xe1, 0xc5, 0xf9, 0xb1, 0x6d, 0x0c, 0xb9, 0x8c, 0x1a, 0x9d, 0x19, 0xcd, 0x18, 0xc7, 0xe0, 0x81, 0x39, 0xd9, 0xec, 0x9f, 0x35, 0x1f, 0x36, 0x18, 0x42, 0xb0, 0x90, 0x9d, 0x9d, 0xa8, 0x90, 0xff, 0x57, 0xd5, 0xe2, 0xfb, 0x13, 0x00, 0xb1, 0x9d, 0xa8, 0x4e, 0x93, 0x58, 0x9d, 0x42, 0xfe, 0x51, 0x60, 0x85, 0xdb, 0xee, 0x76, 0xb3, 0x3a, 0xb7, 0x03, 0xf7, 0x22, 0x40, 0x64, 0xdd, 0xe3
]);

var loginMuEvo = new Buffer.from([
    0xc3, 0x5a, 0x5f, 0x19, 0x07, 0x32, 0x49, 0xcc, 0x76, 0x5b, 0xec, 0x4e, 0x7b, 0x97, 0x12, 0x02, 0x14, 0x58, 0xb2, 0x93, 0xbc, 0xf5, 0x8e, 0xbb, 0xd3, 0xea, 0x33, 0xe1, 0xc5, 0xf9, 0xb1, 0x6d, 0x0c, 0xb9, 0x8c, 0x1a, 0x9d, 0x19, 0xcd, 0x18, 0xc7, 0xe0, 0x81, 0x39, 0xd9, 0xec, 0x05, 0x36, 0x6a, 0xe3, 0xda, 0xb3, 0x10, 0x08, 0x54, 0xdb, 0xee, 0x87, 0x9d, 0x7c, 0xd2, 0xc7, 0xa2, 0xd3, 0x9d, 0x58, 0x9d, 0xa8, 0xbf, 0x38, 0x4e, 0x01, 0x62, 0xa8, 0xb0, 0xf0, 0xcd, 0xdb, 0xee, 0xc5, 0x65, 0x0b, 0x4d, 0xd9, 0xfb, 0x95, 0x0e, 0x10, 0xa0, 0x9e
]);


var loginMuFinal = new Buffer.from([
    0xc3, 0x3c, 0x9a, 0xdf, 0x54, 0xc1, 0x5f, 0xe4, 0xb2, 0xe2, 0x2f, 0xd9, 0xcc, 0xd7, 0x9d, 0xc5, 0x3f, 0xbb, 0x30, 0x16, 0x13, 0x2a, 0xe7, 0x57, 0xec, 0x88, 0xb8, 0xb3, 0x80, 0x6b, 0x7f, 0x89, 0x62, 0x87, 0x80, 0x63, 0x83, 0xfb, 0xfc, 0xbc, 0x6e, 0x58, 0x6b, 0x70, 0x0a, 0x02, 0x25, 0x8d, 0x0a, 0xd4, 0xaa, 0x27, 0xf8, 0xfe, 0x3e, 0x9d, 0x8e, 0x38, 0xf7, 0x7b
]);

var loginMuGold = new Buffer.from('c3b324fb31f148b711503bbe9bf09fa46055d678f304cd61d5cb7b7a6329dd59e743ee50ebdbce66c9b5a3eb62d2367faf4285dc7fc02974bb2593169d8c6ee5afed0b6910df508c707003d6c92c14837936650662438342c2e000f99aaa653c2b076b6f66918b791427b2f75574a5a3cd5b13386aba093ada12474729c9dedd7c45e726f499360258ded7f431f64c2df367f4f0035202e1005398400c0ca7c0d1293b4cda4e6fbfc7e3ae96a2958356ed580f', 'hex');




//var encryptor = new Encryptor();
//var decriptor = new Decryptor();
//var r = decriptor.DecryptC3(loginMuGold);
//
//decryptLogin(decriptor.InternalDecrypt32(r));
//
//function decryptLogin(dec2) {
//    var login = dec2.slice(4, 14);
//    var pass = dec2.slice(14, 34);
//
//    console.log(toHex(dec2[0]));
//    console.log(toHex(dec2[1]), 'size');
//    console.log(toHex(dec2[2]), 'code');
//    console.log(toHex(dec2[3]), 'subcode');
//    console.log(decriptor.InternalEncrypt(login, 0).toString());
//    console.log(decriptor.InternalEncrypt(pass, 0).toString());
//    console.log(toHex(dec2.slice(34, 38)), 'count');
//    console.log(toHex(dec2.slice(38, 43), ','));
//    console.log(hex2a(toHex(dec2.slice(38, 43), 'nospace')), 'version');
//    console.log(hex2a(toHex(dec2.slice(43, 59), 'nospace')), 'serial');
//}


//var loginRequestHeader = [
//    0xc3, 0x00, 0xf1, 0x01
//];
//var clientVersion = [0x31,0x30,0x34,0x30,0x34]; // 1.04.04
//var clientSerial = 'k1Pk2jcET48mxL3b'; // 16 length!
////var tickCount = os.uptime() * 1000; // in milliseconds
//var tickCount = new Buffer.from([0x6e, 0x7a, 0xe5, 0x01]);
//
//var loginInHex = 'tocher'.hexEncode();
//var username = Buffer.alloc(10);
//loginInHex.forEach(function(e, i) {
//    username[i] = e;
//});
//
//var passInHex = 'tocher'.hexEncode();
//var password = Buffer.alloc(20);
//passInHex.forEach(function(e, i) {
//    password[i] = e;
//});
//
//var loginRequest = Buffer.concat([
//    Buffer.from(loginRequestHeader),
//    encryptor.InternalEncrypt(username, 0),  // Xor3
//    encryptor.InternalEncrypt(password, 0),  // Xor3
//    //Buffer(tickCount.toString(16), 'hex'),
//    tickCount,
//    Buffer.from(clientVersion),
//    Buffer.from(clientSerial.hexEncode()),
//    Buffer.alloc(1)
//]);
//loginRequest[1] = loginRequest.length;
//
//var encLoginPacket = encryptor.InternalEncrypt32(loginRequest);
//console.log('SIZE2: ', encLoginPacket.length);
//console.log(encLoginPacket.toString('hex'));
//var encFinalLoginPacket = encryptor.EncryptC3(encLoginPacket);
//
//console.log(encFinalLoginPacket.toString('hex'));
//console.log(encFinalLoginPacket.length);
//console.log('===END===');
//
//var holy= decriptor.DecryptLogin(encFinalLoginPacket);
//
//decryptLogin(holy);























//var loginRequestHeader = [
//    0xc3, 0x00, 0xf1, 0x01
//];
//var clientVersion = [0x31,0x30,0x34,0x30,0x34]; // 1.04.04
//var clientSerial = 'k1Pk2jcET48mxL3b'; // 16 length!
//var tickCount = os.uptime() * 1000; // in milliseconds
//
//var loginInHex = 'tocher'.hexEncode();
//var username = Buffer.alloc(10);
//loginInHex.forEach(function(e, i) {
//    username[i] = e;
//});
//
//var passInHex = 'tocher'.hexEncode();
//var password = Buffer.alloc(20);
//passInHex.forEach(function(e, i) {
//    password[i] = e;
//});
//
//var loginRequest = Buffer.concat([
//    Buffer.from(loginRequestHeader),
//    InternalEncrypt(username, 0),  // Xor3
//    InternalEncrypt(password, 0),  // Xor3
//    Buffer(tickCount.toString(16), 'hex'),
//    Buffer.from(clientVersion),
//    Buffer.from(clientSerial.hexEncode()),
//    Buffer.alloc(1) // wtf ???
//]);
//loginRequest[1] = loginRequest.length;
//var encLoginPacket = InternalEncrypt32(loginRequest);
//var encFinalLoginPacket = EncryptC3(encLoginPacket);
//
//console.log(encFinalLoginPacket);

//var decryptedData = Decrypt(unknown2);
//var decryptedData2 = Decrypt(packet2);

//console.log(decryptedData);
//console.log(toHex(decryptedData2[0]));
//console.log(toHex(decryptedData2[1]), 'size');
//console.log(toHex(decryptedData2[2]), 'code');
//console.log(toHex(decryptedData2[3]), 'subcode');

//InternalEncrypt32

//var dec2 = InternalDecrypt32(decryptedData);
//console.log('');
//console.log(dec2.toString('hex'));
////console.log(toHex(decryptedData));
//
//var login = dec2.slice(4, 14);
//var pass = dec2.slice(14, 34);
//console.log('login', login);
//console.log('pass', pass);

//console.log(toHex(dec2[0]));
//console.log(toHex(dec2[1]), 'size');
//console.log(toHex(dec2[2]), 'code');
//console.log(toHex(dec2[3]), 'subcode');
//console.log(toHex(decryptedData.slice(4, 14)), 'login');
//console.log(toHex(decryptedData.slice(14, 34)), 'pass');

//console.log(login);
//console.log(InternalEncrypt(login, 0).toString());
//
//console.log(InternalEncrypt(pass, 0).toString());
//
//console.log(toHex(dec2.slice(34, 38)), 'count');
//console.log(toHex(dec2.slice(38, 43), ','));
//console.log(hex2a(toHex(dec2.slice(38, 43), 'nospace')), 'version');
//console.log(hex2a(toHex(dec2.slice(43, 59), 'nospace')), 'serial');
//
//console.log(hex2a(toHex(decryptedData, '')), 'login');

//console.log(stringToBase64('c3,18,43,17,38,70,ca,b7,90,9e,69,c3,f6,82,8,57,1,54,61,91,c4,c0,52,6c'));
function stringToBase64(str) {
    //var a = 'c3,d,69,72,8,50,c8,3d,b6,8,94,81,b8';
    var arr = str.split(',');
    var arr2 = arr.map(function(i, e){
        return parseInt(i, 16);
    });
    return new Buffer.from(arr2).toString('base64');
    //"195,13,105,114,8,80,200,61,182,8,148,129,184"
}

function toHex(val, separator) {
    if (typeof val === 'number') {
        var n = val.toString(16);
        return n.length === 2 ? n : '0'+n;
    } else {
        var str = '';
        separator = separator || ' ';

        separator = separator === 'nospace' ? '' : separator;

        for (var i = 0; i < val.length; i++) {
            str += val[i].toString(16) + separator;
        }
        return str;
    }
}
