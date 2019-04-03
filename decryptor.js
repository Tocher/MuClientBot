var simpleModules = require('./simpleModules');

class Decryptor extends simpleModules {
    constructor() {
        super();
    }

    DecryptLogin(packet) {
        return this.InternalDecrypt32(this.DecryptC3(packet));
    }

    DecryptC3(packet) {
        var headerSize = this.GetPacketHeaderSize(packet);
        var contentSize = this.GetContentSize(packet, false);
        var result = this.GetMaximumDecryptedSize(packet);
        var resultBuffer = new Buffer.alloc(result);

//        console.log(headerSize, contentSize, result);

        var decrypted = this.DecodeBuffer(packet, headerSize, contentSize, resultBuffer);

//        console.log(decrypted);
        resultBuffer = decrypted[0];
        var decryptedSize = decrypted[1];

        decryptedSize += headerSize - 1;

        // resize buffer
        resultBuffer = resultBuffer.slice(0, decryptedSize);

        resultBuffer[0] = packet[0];
        resultBuffer[1] = decryptedSize; // TODO: подумать про C4!!!

        return resultBuffer;
    }

    DecryptC4(packet) {
        var headerSize = this.GetPacketHeaderSize(packet);
        var contentSize = this.GetContentSize(packet, false);
        var result = this.GetMaximumDecryptedSize(packet);
        var resultBuffer = new Buffer.alloc(result);

        var decrypted = this.DecodeBuffer(packet, headerSize, contentSize, resultBuffer);

        resultBuffer = decrypted[0];
        var decryptedSize = decrypted[1];

        decryptedSize += headerSize - 1;

        // resize buffer
        resultBuffer = resultBuffer.slice(0, decryptedSize);

        resultBuffer[0] = packet[0];
        resultBuffer[1] = decryptedSize; // TODO: подумать про C4!!!

        return resultBuffer;
    }

    DecodeBuffer(inputBuffer, offset, size, resultBuffer) {
        var sizeCounter = 0;
        if ((size % this.EncryptedBlockSize) != 0) {
            //return sizeCounter;
        }
        var EncryptedBlockBuffer = new Buffer.from(this.EncryptedBlockSize);
        var DecryptedBlockBuffer = new Buffer.from(this.DecryptedBlockSize);

        for (var i = 0; i < size; i += this.EncryptedBlockSize) {
            EncryptedBlockBuffer = this.BlockCopy(inputBuffer, i + offset, EncryptedBlockBuffer, 0, this.EncryptedBlockSize);
            var decoded = this.BlockDecode(EncryptedBlockBuffer, DecryptedBlockBuffer);

            DecryptedBlockBuffer = decoded[0];
            var blockSize = decoded[1];

            if (blockSize != -1)
            {
//                console.log(DecryptedBlockBuffer);
                resultBuffer = this.BlockCopy(DecryptedBlockBuffer, 0, resultBuffer, (offset - 1) + sizeCounter, blockSize);
                sizeCounter += blockSize;
            }
        }

//        console.log(resultBuffer.toString('hex'));
        return [resultBuffer, sizeCounter];
    }

    BlockCopy(inputBuffer, offset, destBuffer, destOffset, size) {
        for (var i = 0; i < size; i++) {
            destBuffer[i + destOffset] = inputBuffer[i + offset];
        }

        return destBuffer;
    }

    CopyArrayToInt(array) {
        var result = 0;

        for (var i = 0; i < array.length; i++) {
            result += (array[i] << (8 * i));
        }

        return result;
    }

    CutFirstByte(value, length) {
        var binaryString = Number(value).toString(2);

        if (binaryString.length > length) {
            binaryString = binaryString.slice(binaryString.length - length);
        }

        return parseInt(binaryString, 2);
    }

    GetPartCryptBuffer(ring, xor, dec, mod, pastRing) {
        var part1 = this.CutFirstByte(ring * dec, 32);
        var part2 = xor ^ (part1 % mod);

        if (pastRing) {
            return part2 ^ (pastRing & 0xFFFF);
        }

        return part2;
    }

    BlockDecode(inputBuffer, outputBuffer) {
        var ShiftBuffer = new Buffer.alloc(4);
        var RingBuffer = new Uint32Array(4);

        ShiftBuffer = this.ClearShiftBuffer(ShiftBuffer);
        ShiftBuffer = this.ShiftBytesDecode(ShiftBuffer, 0x00, inputBuffer, 0x00, 0x10);
        ShiftBuffer = this.ShiftBytesDecode(ShiftBuffer, 0x16, inputBuffer, 0x10, 0x02);
        RingBuffer[0] = this.CopyArrayToInt(ShiftBuffer);

        ShiftBuffer = this.ClearShiftBuffer(ShiftBuffer);
        ShiftBuffer = this.ShiftBytesDecode(ShiftBuffer, 0x00, inputBuffer, 0x12, 0x10);
        ShiftBuffer = this.ShiftBytesDecode(ShiftBuffer, 0x16, inputBuffer, 0x22, 0x02);
        RingBuffer[1] = this.CopyArrayToInt(ShiftBuffer);

        ShiftBuffer = this.ClearShiftBuffer(ShiftBuffer);
        ShiftBuffer = this.ShiftBytesDecode(ShiftBuffer, 0x00, inputBuffer, 0x24, 0x10);
        ShiftBuffer = this.ShiftBytesDecode(ShiftBuffer, 0x16, inputBuffer, 0x34, 0x02);
        RingBuffer[2] = this.CopyArrayToInt(ShiftBuffer);

        ShiftBuffer = this.ClearShiftBuffer(ShiftBuffer);
        ShiftBuffer = this.ShiftBytesDecode(ShiftBuffer, 0x00, inputBuffer, 0x36, 0x10);
        ShiftBuffer = this.ShiftBytesDecode(ShiftBuffer, 0x16, inputBuffer, 0x46, 0x02);

        RingBuffer[3] = this.CopyArrayToInt(ShiftBuffer);
        RingBuffer[2] = RingBuffer[2] ^ this.clientDecryptor.xor[2] ^ (RingBuffer[3] & 0xFFFF);
        RingBuffer[1] = RingBuffer[1] ^ this.clientDecryptor.xor[1] ^ (RingBuffer[2] & 0xFFFF);
        RingBuffer[0] = RingBuffer[0] ^ this.clientDecryptor.xor[0] ^ (RingBuffer[1] & 0xFFFF);

        var CryptBuffer = new Uint16Array(4);
        CryptBuffer[0] = this.GetPartCryptBuffer(RingBuffer[0], this.clientDecryptor.xor[0], this.clientDecryptor.dec[0], this.clientDecryptor.mod[0]);
        CryptBuffer[1] = this.GetPartCryptBuffer(RingBuffer[1], this.clientDecryptor.xor[1], this.clientDecryptor.dec[1], this.clientDecryptor.mod[1], RingBuffer[0]);
        CryptBuffer[2] = this.GetPartCryptBuffer(RingBuffer[2], this.clientDecryptor.xor[2], this.clientDecryptor.dec[2], this.clientDecryptor.mod[2], RingBuffer[1]);
        CryptBuffer[3] = this.GetPartCryptBuffer(RingBuffer[3], this.clientDecryptor.xor[3], this.clientDecryptor.dec[3], this.clientDecryptor.mod[3], RingBuffer[2]);

        return this.DecodeFinal(inputBuffer, CryptBuffer, outputBuffer);
    }

    DecodeFinal(inputBuffer, CryptBuffer, outputBuffer) {
        var ShiftBuffer = new Buffer.alloc(4);
        ShiftBuffer = this.ShiftBytesDecode(ShiftBuffer, 0x00, inputBuffer, 0x48, 0x10);

        var blockSize = ShiftBuffer[0] ^ ShiftBuffer[1] ^ this.BlockSizeXorKey;
        var arr1 = this.CopyIntToArray(CryptBuffer[0], 0, 2);
        arr1 = arr1.concat(this.CopyIntToArray(CryptBuffer[1], 0, 2));
        arr1 = arr1.concat(this.CopyIntToArray(CryptBuffer[2], 0, 2));
        arr1 = arr1.concat(this.CopyIntToArray(CryptBuffer[3], 0, 2));

        outputBuffer = new Buffer.from(arr1);

        var checksum = this.BlockCheckSumXorKey;
        for (var i = 0; i < blockSize; i++) {
            checksum ^= outputBuffer[i];
        }
//        console.log(outputBuffer);

//        console.log(Number(ShiftBuffer[1]).toString(16));
//        console.log('checksum: ', Number(checksum).toString(16));

        if (ShiftBuffer[1] != checksum)
        {
            // тут что-то делать если чексумма неправильная
            //console.log(ShiftBuffer[1], checksum);
        }

        return [outputBuffer, blockSize];
    }

    ShiftBytesDecode(outputBuffer, outputOffset, inputBuffer, shiftOffset, length) {
        var size = this.GetShiftSize(length, shiftOffset);
        var shiftArray = new Buffer.alloc(4);
        var copyOffset = Math.floor(shiftOffset / this.DecryptedBlockSize);

        shiftArray[0] = outputBuffer[0]; // вроде надо
        shiftArray = this.BlockCopy(inputBuffer, copyOffset, shiftArray, 0, size);

        var tempShift = (length + shiftOffset) & 0x7;
        if (tempShift != 0)
        {
            shiftArray[size - 1] = shiftArray[size - 1] & 0xFF << (8 - tempShift);
        }

        return this.InternalShiftBytes(outputBuffer, outputOffset, shiftArray, shiftOffset, size);
    }

    ClearShiftBuffer(ShiftBuffer) {
        ShiftBuffer[0] = 0;
        ShiftBuffer[1] = 0;
        ShiftBuffer[2] = 0;
        ShiftBuffer[3] = 0;

        return ShiftBuffer;
    }

    /**
     * @param buffer
     * @returns {number}
     */
    GetMaximumDecryptedSize (buffer) {
        return Math.floor(
            (
                (
                    this.GetContentSize(buffer, false) / this.EncryptedBlockSize
                ) * this.DecryptedBlockSize
            ) + this.GetPacketHeaderSize(buffer) - 1
        );
    }
}

module.exports = Decryptor;
