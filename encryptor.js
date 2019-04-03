var simpleModules = require('./simpleModules');

class Encryptor extends simpleModules {
    constructor(name) {
        super();
    }

    EncryptC3(buffer) {
        var headerSize = this.GetPacketHeaderSize(buffer);
        var contentSize = this.GetContentSize(buffer, true);
        var contents = buffer.slice(1); // контент это все кроме c1/c2/c3/c4
        var result = this.GetEncryptedSize(buffer);
        contents[0] = 0; // должно быть = Counter.Count и видимо увеличиваться
        var resultBuffer = this.EncodeBuffer(contents, headerSize, contentSize, result);

        // TODO C4 с большим пакетом
        resultBuffer[0] = buffer[0];
        resultBuffer[1] = result;

        return resultBuffer;
    }

    EncodeBuffer(inputBuffer, offset, size, result) {
        var i = 0;
        var sizeCounter = 0;
        var DecryptedBlockBuffer;
        var EncryptedBlockBuffer;
        var resultBuffer = new Buffer.alloc(result);

        while (i < size) {
            if (i + this.DecryptedBlockSize < size) {
                DecryptedBlockBuffer = inputBuffer.slice(i, i + this.DecryptedBlockSize);

                EncryptedBlockBuffer = this.BlockEncode(DecryptedBlockBuffer, this.DecryptedBlockSize);
            } else {
                DecryptedBlockBuffer = Buffer.alloc(this.DecryptedBlockSize);
                inputBuffer.copy(DecryptedBlockBuffer, 0, i, size);

                EncryptedBlockBuffer = this.BlockEncode(DecryptedBlockBuffer, size - i);
            }

            for(var j = 0; j < EncryptedBlockBuffer.length; j++) {
                resultBuffer[j + offset + sizeCounter] = EncryptedBlockBuffer[j];
            }

            i += this.DecryptedBlockSize;
            sizeCounter += this.EncryptedBlockSize;
        }

        return resultBuffer;
    }

    BlockEncode(DecryptedBlockBuffer, blockSize) {
        return this.SetRingBuffer(DecryptedBlockBuffer, blockSize);
    }

    SetRingBuffer(buffer, blockSize) {
        var byte1 = buffer.readUInt16LE(0);
        var byte2 = buffer.readUInt16LE(2);
        var byte3 = buffer.readUInt16LE(4);
        var byte4 = buffer.readUInt16LE(6);

        var part1 = (this.clientEncryptor.xor[0] ^ byte1) * this.clientEncryptor.enc[0] % this.clientEncryptor.mod[0];
        var part2 = (this.clientEncryptor.xor[1] ^ byte2 ^ (part1 & 0xFFFF)) * this.clientEncryptor.enc[1] % this.clientEncryptor.mod[1];
        var part3 = (this.clientEncryptor.xor[2] ^ byte3 ^ (part2 & 0xFFFF)) * this.clientEncryptor.enc[2] % this.clientEncryptor.mod[2];
        var part4 = (this.clientEncryptor.xor[3] ^ byte4 ^ (part3 & 0xFFFF)) * this.clientEncryptor.enc[3] % this.clientEncryptor.mod[3];

        part1 = part1 ^ this.clientEncryptor.xor[0] ^ (part2 & 0xFFFF);
        part2 = part2 ^ this.clientEncryptor.xor[1] ^ (part3 & 0xFFFF);
        part3 = part3 ^ this.clientEncryptor.xor[2] ^ (part4 & 0xFFFF);

        var ring = new Uint32Array([part1, part2, part3, part4]);
        // создаем пустой буфер
        var shiftBuffer = new Buffer.alloc(4);
        var outputBuffer = new Buffer.alloc(11);

        outputBuffer = this.ShiftBytes(outputBuffer, 0x00, part1, 0x00, 0x10);
        outputBuffer = this.ShiftBytes(outputBuffer, 0x10, part1, 0x16, 0x02);
        outputBuffer = this.ShiftBytes(outputBuffer, 0x12, part2, 0x00, 0x10);
        outputBuffer = this.ShiftBytes(outputBuffer, 0x22, part2, 0x16, 0x02);
        outputBuffer = this.ShiftBytes(outputBuffer, 0x24, part3, 0x00, 0x10);
        outputBuffer = this.ShiftBytes(outputBuffer, 0x34, part3, 0x16, 0x02);
        outputBuffer = this.ShiftBytes(outputBuffer, 0x36, part4, 0x00, 0x10);
        outputBuffer = this.ShiftBytes(outputBuffer, 0x46, part4, 0x16, 0x02);

        return this.EncodeFinal(blockSize, buffer, outputBuffer);
    }

    EncodeFinal(blockSize, inputBuffer, outputBuffer) {
        var size = blockSize ^ this.BlockSizeXorKey;
        var checksum = this.BlockCheckSumXorKey;
        for (var i = 0; i < blockSize; i++) {
            checksum ^= inputBuffer[i];
        }

        size ^= checksum;

        //console.log('checksum', Number(checksum << 8 | size).toString(16));

        var temp = this.ShiftBytes(outputBuffer, 0x48, checksum << 8 | size, 0x00, 0x10);
        //console.log(temp);
        return temp;
    }

    ShiftBytes(outputBuffer, outputOffset, part, shiftOffset, length) {
        var size = this.GetShiftSize(length, shiftOffset);
        var valueOffset = Math.floor(shiftOffset / this.DecryptedBlockSize);

        //this.ShiftBuffer[2] = 0; // the first two bytes will be set at the next statement
        var ShiftBuffer = this.CopyIntToArray(part, valueOffset, size);
        return this.InternalShiftBytes(outputBuffer, outputOffset, ShiftBuffer, shiftOffset, size);
    }
}

module.exports = Encryptor;
