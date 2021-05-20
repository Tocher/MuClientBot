var os = require('os');
var Encryptor = require('./encryptor');
var Decryptor = require('./decryptor');

class packetList {
    constructor() {
        this.encryptor = new Encryptor();
        this.decryptor = new Decryptor();

        this.getCharacterList = new Buffer.from([0xc1, 0x04, 0xF3, 0x00]);
        this.focusCharHeader = new Buffer.from([0xc1, 0x0e, 0xf3, 0x15]);
        this.selectCharHeader = new Buffer.from([0xc1, 0x0e, 0xf3, 0x03]);

        this.loginRequestHeader = new Buffer.from([0xc3, 0x00, 0xf1, 0x01]);
        this.checksumHeader = new Buffer.from([0xc3, 0x08, 0x03, 0x0c]);
        // 1.04.04
        this.clientVersion = new Buffer.from([0x31, 0x30, 0x34, 0x30, 0x34]);
        this.clientSerial = 'k1Pk2jcET48mxL3b'; // 16 length!

        this.tickCount = os.uptime() * 1000; // in milliseconds
    }

    selectChar(name) {
        return Buffer.concat([
            this.selectCharHeader,
            this.stringToBuffer(name)
        ]);
    }

    focusChar(name) {
        return Buffer.concat([
            this.focusCharHeader,
            this.stringToBuffer(name)
        ]);
    }

    login(username, password) {
        username = this.stringToBuffer(username);
        password = this.stringToBuffer(password, 20);

        var loginRequest = Buffer.concat([
            this.loginRequestHeader,
            this.encryptor.InternalEncrypt(username, 0),  // Xor3
            this.encryptor.InternalEncrypt(password, 0),  // Xor3
            Buffer.from(this.tickCount.toString(16), 'hex'),
            this.clientVersion,
            Buffer.from(this.clientSerial.hexEncode())
            //Buffer.alloc(1) // wtf?
        ]);
        loginRequest[1] = loginRequest.length;

        console.log(this.loginRequestHeader);
        console.log(this.encryptor.InternalEncrypt(username, 0));
        console.log(this.encryptor.InternalEncrypt(password, 0));
        console.log(Buffer.from(this.tickCount.toString(16), 'hex'));
        console.log(this.clientVersion);
        console.log(Buffer.from(this.clientSerial.hexEncode()));

        return loginRequest;
    }

    // acc/char name in 10byte buffer
    // password in 20byte bufer
    stringToBuffer(name, size) {
//        if (name.length > 10) return;

        size = size || 10;

        var nameInHex = name.hexEncode();
        var charname = Buffer.alloc(size);
        nameInHex.forEach(function(e, i) {
            charname[i] = e;
        });

        return charname;
    }
}

module.exports = packetList;
