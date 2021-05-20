var Encryptor = require('./encryptor');
var Decryptor = require('./decryptor');
var PacketList = require('./packetList');
var CheckSum = require('./CheckSum');

class packetHandler {
    constructor(gameserver) {
        if (gameserver) {
            this.gameserver = gameserver;
        }

        this.encryptor = new Encryptor();
        this.decryptor = new Decryptor();
        this.packetList = new PacketList();
        this.checkSum = new CheckSum();

        this.packetQueue = '';
    }

    tryParsePacket() {
        if (this.packetQueue.length < 4) return;

        var type = this.packetQueue.slice(0, 2),
            size, sizeInt;

        if (type === 'c1' || type === 'c3') {
            size = this.packetQueue.slice(2, 4);
            sizeInt = parseInt(size, 16) * 2;

            if (this.packetQueue.length >= sizeInt) {
                this.parse(this.packetQueue);
            }
        } else {
            size = this.packetQueue.slice(2, 6);
            sizeInt = parseInt(size, 16) * 2;

            if (this.packetQueue.length >= sizeInt) {
                this.parse(this.packetQueue);
            }
        }
    }

    tryParseClientPacket() {
        if (this.packetQueueClient.length < 4) return;

        var type = this.packetQueueClient.slice(0, 2),
            size, sizeInt;

        if (type === 'c1' || type === 'c3') {
            size = this.packetQueueClient.slice(2, 4);
            sizeInt = parseInt(size, 16) * 2;

            if (this.packetQueueClient.length >= sizeInt) {
                this.clientParse(this.packetQueueClient);
            }
        } else {
            size = this.packetQueueClient.slice(2, 6);
            sizeInt = parseInt(size, 16) * 2;

            if (this.packetQueueClient.length >= sizeInt) {
                this.clientParse(this.packetQueueClient);
            }
        }
    }

    addServerPacket(packet) {
        this.packetQueue += packet;

        this.tryParsePacket();
    }

    addClientPacket(packet) {
        this.packetQueueClient += packet;

        this.tryParseClientPacket();
    }

    clientParse(packet) {
        var packetType = packet.slice(0, 2),
            packetSize, sizeInt, packetCode, packetSubcode, packetContent;

        if (packetType === 'c1' || packetType === 'c3') {
            packetSize = packet.slice(2, 4);
            sizeInt = parseInt(packetSize, 16) * 2;

        } else {
            packetSize = packet.slice(2, 6);
            sizeInt = parseInt(packetSize, 16) * 2;

        }

        this.packetQueueClient = this.packetQueueClient.slice(sizeInt);



        this.tryParseClientPacket();
    }

    parse(packet) {
        var unhandle = false;
        var packetType = packet.slice(0, 2),
            packetSize, sizeInt, packetCode, packetSubcode, packetContent;

        if (packetType === 'c1' || packetType === 'c3') {
            packetSize = packet.slice(2, 4);
            sizeInt = parseInt(packetSize, 16) * 2;

            if (packetType === 'c3') {
                let packetC3 = new Buffer.from(packet.slice(0, sizeInt), 'hex');
                packet = this.decryptor.DecryptC3(packetC3);
                packet = packet.toString('hex');
            }

            packetCode = packet.slice(4, 6);
            packetSubcode = packet.slice(6, 8);
            packetContent = packet.slice(8, sizeInt);
        } else {
            packetSize = packet.slice(2, 6);
            sizeInt = parseInt(packetSize, 16) * 2;

            if (packetType === 'c4') {
                let packetC4 = new Buffer.from(packet.slice(0, sizeInt), 'hex');
                packet = this.decryptor.DecryptC4(packetC4);
                packet = packet.toString('hex');
            }

            packetCode = packet.slice(6, 8);
            packetSubcode = packet.slice(8, 10);
            packetContent = packet.slice(10, sizeInt);
        }

        this.packetQueue = this.packetQueue.slice(sizeInt);

//        if (this.packetQueue.indexOf('c3') > -1) {
            console.log(packetType, packetCode, packetSubcode, packetContent);
//        }

        switch (packetType) {
            case 'c1':

                switch (packetCode) {
                    case '03':
                        switch (packetSubcode) {
                            case '00':
                                console.log('CHECKSUM');
                                console.log(packetType,packetSize,packetCode,packetSubcode);
                                console.log(packetContent);

                                var challenge = parseInt(packetContent, 16);
//                                var challenge = parseInt('2cbf', 16);

                                var checkSum = this.checkSum.getCheckSumTable(challenge);
                                var CSPacket = Buffer.concat([
                                    this.packetList.checksumHeader,
                                    checkSum
                                ]);

                                //<Buffer c3 08 03 00 3a 9c ec 89>

                                console.log('PACKET');
                                console.log(CSPacket);

                                CSPacket = this.encryptor.InternalEncrypt32(CSPacket);
                                CSPacket = this.encryptor.EncryptC3(CSPacket);
                                console.log(CSPacket);

                                this.sendC3(CSPacket);

                                break;
                            case 'ff':
                                console.log('checksum2');

//                                var challenge = parseInt('2cbf', 16);

//                                var checkSum = this.checkSum.GetChecksum(challenge);
//                                var CSPacket = Buffer.concat([
//                                    this.packetList.checksumHeader,
//                                    checkSum
//                                ]);

//                                console.log('PACKET');
//                                console.log(CSPacket);

                                break;
                            default:
                                unhandle = true;
                                break;
                        }
                        break;
                    case '26':

                        switch (packetSubcode) {
                            case 'fe':
                                // RecvHPSD
                                break;
                            default:
                                unhandle = true;
                                break;
                        }

                        break;
                    case '27':

                        switch (packetSubcode) {
                            case 'fe':
                                // RecvMPAG
                                break;
                            default:
                                unhandle = true;
                                break;
                        }

                        break;
                    case 'f1':

                        switch (packetSubcode) {
                            case '00':
                                // Server Info
                                // Success / Player-ID / Version (c10cf10001384f3130343034)
                                var success = packetContent.slice(0, 2);
                                var playerId = packetContent.slice(2, 6);
                                var version = packetContent.slice(6);

                                console.log('Get login dialog: ', success === '01' ? 'success' : 'unknown');
                                console.log('Player Id: ', playerId);
                                console.log('Version: ', version);

                                var loginRequest = this.packetList.login('test0', 'test0');
                                console.log('LOGIN REQUEST:', loginRequest.toString('hex'));
                                this.sendC3(loginRequest);

                                break;
                            case '01':
                                // Login result
                                if (packetContent === '01') {
                                    console.log('Login Success');
                                } else {
                                    console.log('Login error: ', packetContent);
                                }

                                break;
                            default:
                                unhandle = true;
                                break;
                        }

                        break;
                    case 'f3':
                        switch (packetSubcode) {
                            case '00': // ??
                                // packetContent
                                // 4 byte - header
                                // 34 * number of chars - char info

                                // char info
                                // 1 byte - number of slot
                                // 10 byte - char name
                                // 1 byte - unknown
                                // 2 byte - char level
                                // 1 byte - state code (0 - common, 6 - PK 2 stage)
                                // 18 byte - items
                                // 1 byte - guild member status code

                                // A flag which indicates the unlocked character classes
                                // 03 - unlocked?
                                var flagUnlocked = packetContent.slice(0, 2);
                                var moveCnt = packetContent.slice(2, 4);
                                var numberOfChars = packetContent.slice(4, 6);
                                var numberOfVaultExtensions = packetContent.slice(6, 8);

                                //console.log('unlocked:', flagUnlocked);
                                //console.log('moveCnt:', moveCnt);
                                //console.log('numberOfChars:', numberOfChars);
                                //console.log('numberOfVaultExtensions:', numberOfVaultExtensions);


//                                for(var i = 8; i+(34*2) <= packetContent.length; i = i+(34*2)) {
//                                    var charInfo = packetContent.slice(i, i+(34*2));
//                                    console.log('slot:', charInfo.slice(0, 2));
//                                    console.log('name:', this.hex2a(charInfo.slice(2, 22)));
//                                    console.log('unknown:', charInfo.slice(22, 24));
//                                    console.log('level:', charInfo.slice(24, 28)); // 0100 - 1lvl
//                                    // appearance
//                                    console.log('guild:', charInfo.slice(64, 66));
//                                }


                                var name = this.hex2a(packetContent.slice(10, 30));
                                console.log('Focus char:', name);
                                this.sendC1(this.packetList.focusChar(name));
                                break;
                            case '15':
                                // character focus confirm
                                // name[10] + unused[1]
                                var name = this.hex2a(packetContent.slice(0, 10));

                                console.log('Focus success:', name);
                                this.sendC1(this.packetList.selectChar(name));
                                break;
                            case '03':
                                // RecvUpPoint ?
                                break;
                            case '04':
                                // Respawn
                                break;
                            case '05':
                                // UpLevel
                                break;
                            case '06':
                                // DownPoint ?
                                // PMSG_LVPOINTADDRESULT
                                break;
                            default:
                                unhandle = true;
                                break;
                        }
                        break;
                    case 'fb':
                        switch (packetSubcode) {
                            case '00':
                                // gCraftSystem.SetData((CRAFT_ANS_USERDATA*)Data);
                                break;
                            case '52': // after getCharacterList
                                // xz
                                // content example: 16040404050a1e
                                break;
                            case '53': // after getCharacterList
                                // items?
                                // content example: 1a0a0a08081246
                                break;
                            case '56':
                                // Dungeon Siege
                                break;
                            case 'ff':
                                // after join in the word
                                // some items?
                                break;
                            default:
                                unhandle = true;
                                break;
                        }
                        break;
                    case '0d':

                        switch (packetSubcode) {
                            case '00':
                                // gold message?
                                console.log('Gold Message:', this.hex2a(packetContent));
                                break;
                            case '01':
                                // Server message
                                console.log('Server Message:', this.hex2a(packetContent));

                                this.sendC1(this.packetList.getCharacterList);

                                break;
                            default:
                                unhandle = true;
                                break;
                        }
                        break;
                    default:
                        unhandle = true;
                        break;
                }

                break;
            case 'c2':
                switch (packetCode) {
                    case 'c0':
                        // Friend List
                        break;
                    case 'f4':
                        // Servers status?
                        break;
                    default:
                        unhandle = true;
                        break;
                }
                break;
            case 'c3':
                switch (packetCode) {
//                    case '03':
//                        break;
                    default:
                        unhandle = true;
                        break;
                }
                break;
            default:
                unhandle = true;
                break;
        }

        if (packetType === 'c3') {
//            console.log(packet);
        }

        if (unhandle) {
//            console.log();
            console.log('GS: ' + packetType + ' size:' + packetSize + ' code:' + packetCode + ' subtype:' + packetSubcode);
//            console.log('data:', packetContent);
//            console.log();
//            var text = this.hex2a(packetContent);
//            if (text.indexOf('MedoniAndrei') > -1) {
//                console.log(text);
//            }
        }

        this.tryParsePacket();
    }

    sendC1(packet) {
        packet = this.encryptor.InternalEncrypt32(packet);

        this.gameserver.write(packet);
    }

    sendC3(packet) {
        packet = this.encryptor.InternalEncrypt32(packet);
        console.log('PACK AFTER 32:', packet.toString('hex'));
        packet = this.encryptor.EncryptC3(packet);

        console.log(packet.toString('hex'));

        this.gameserver.write(packet);
    }

    hex2a(hexx) {
        var hex = hexx.toString();//force conversion
        var str = '';
        for (var i = 0; i < hex.length; i += 2) {
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        return str;
    }
}

module.exports = packetHandler;
