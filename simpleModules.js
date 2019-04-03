class SimpleModules {
    constructor() {
        this.BlockCheckSumXorKey = 0xF8;
        this.BlockSizeXorKey = 0x3D;

        this.DecryptedBlockSize = 8;
        this.EncryptedBlockSize = 11;

        this.Xor3Key = [0xFC, 0xCF, 0xAB];
        // AB 11 CD FE 18 23 C5 A3
        // CA 33 C1 CC 66 67 21 F3
        // 32 12 15 35 29 FF FE 1D
        // 44 EF CD 41 26 3C 4E 4D
        this.Xor32Key = [
            0xAB, 0x11, 0xCD, 0xFE, 0x18, 0x23, 0xC5, 0xA3,
            0xCA, 0x33, 0xC1, 0xCC, 0x66, 0x67, 0x21, 0xF3,
            0x32, 0x12, 0x15, 0x35, 0x29, 0xFF, 0xFE, 0x1D,
            0x44, 0xEF, 0xCD, 0x41, 0x26, 0x3C, 0x4E, 0x4D
        ];

        // Evo mu
        this.Xor32Key3 = [
            0x54, 0xAD, 0x00, 0x0F, 0x33, 0xFE, 0x31, 0xBB,
            0x9A, 0x13, 0x56, 0xAC, 0x71, 0x83, 0x60, 0x2B,
            0x13, 0x47, 0xBF, 0x28, 0xE9, 0x00, 0x7F, 0x10,
            0x6F, 0x32, 0x65, 0xF6, 0x92, 0x1D, 0xD3, 0xEF
        ];

        // Final Mu
        this.Xor32KeyFinal = [
            0x93, 0x6C, 0x30, 0x8E, 0x97, 0x22, 0xBC, 0x70, 0x00, 0x10, 0xBD, 0x9D, 0xA8, 0xF2, 0xFE, 0xF2, 0xDC, 0xEB, 0x97, 0x93, 0x76, 0x99, 0xD2, 0x48, 0x49, 0x65, 0xDB, 0xEA, 0x8F, 0xD3, 0x69, 0x70
        ];

        this.Xor32KeyGoldMu = [
            0xAB, 0x11, 0xCD, 0xFE, 0x18, 0x23, 0xC5, 0xA3,
            0xCA, 0x33, 0xC1, 0xCC, 0x66, 0x67, 0x21, 0xF3,
            0x32, 0x12, 0x15, 0x35, 0x29, 0xFF, 0xFE, 0x1D,
            0x44, 0xEF, 0xCD, 0x41, 0x26, 0x3C, 0x4E, 0x4D

//            0x33, 0x53, 0xE9, 0xFE, 0xE6, 0xA4, 0x12, 0xD5, 0x7E, 0x4D, 0x8C, 0x40, 0x26, 0x41, 0x60, 0xE2, 0xA7, 0xD0, 0xA4, 0xE2, 0xAF, 0x2A, 0xAC, 0xD2, 0xE7, 0x7F, 0xD7, 0xF7, 0xA2, 0xFA, 0xCE, 0xFB
        ];

        this.Xor32KeyNew = [
            0xEE, 0x22, 0x26, 0x0F, 0x3C, 0xA3, 0xF3, 0x29, 0xD2, 0xC1, 0x97, 0x3B, 0x4A, 0xC9, 0xA9, 0xE3, 0x91, 0xB7, 0x69, 0x20, 0xA8, 0xC9, 0xD7, 0xA6, 0xA8, 0xFB, 0xFF, 0x68, 0x9B, 0xE7, 0x55, 0xDB
        ];

        // Server decryptor
        this.clientEncryptor = {
            mod:  new Uint32Array([128079, 164742, 70235, 106898]),
            enc:  new Uint32Array([23489, 11911, 19816, 13647]),
            xor:  new Uint32Array([48413, 46165, 15171, 37433])
        };

        this.DefaultServerKey = {
            mod:  new Uint32Array([73326, 109989, 98843, 171058]),
            dec:  new Uint32Array([13169, 19036, 35482, 29587]),
            xor:  new Uint32Array([62004, 64409, 35374, 64599])
        };

        this.DefaultClientKey = {
            mod:  new Uint32Array([128079, 164742, 70235, 106898]),
            dec:  new Uint32Array([23489, 11911, 19816, 13647]),
            xor:  new Uint32Array([48413, 46165, 15171, 37433])
        };

        // Ключ для расшифровки client -> server
        this.clientDecryptor = {
            mod:  new Uint32Array([128079, 164742, 70235, 106898]),
            dec:  new Uint32Array([31544, 2047, 57011, 10183]),
            xor:  new Uint32Array([48413, 46165, 15171, 37433])
        };
    }

    InternalShiftBytes(outputBuffer, outputOffset, shiftArray, shiftOffset, size) {
        shiftOffset &= 0x7;
        shiftArray = this.ShiftRight(shiftArray, size, shiftOffset);
        shiftArray = this.ShiftLeft(shiftArray, size + 1, outputOffset & 0x7);
        if ((outputOffset & 0x7) > shiftOffset) {
            size++;
        }

        var offset = Math.floor(outputOffset / this.DecryptedBlockSize);
        for (var i = 0; i < size; i++) {
            outputBuffer[i + offset] |= shiftArray[i];
        }

        return outputBuffer;
    }

    ShiftLeft(data, size, shift) {
        if (shift == 0) {
            return data;
        }

        for (var i = 1; i < size; i++) {
            data[size - i] = (data[size - i] >> shift) | (data[size - i - 1] << (8 - shift));
        }

        data[0] >>= shift;
        return data;
    }

    ShiftRight(data, size, shift) {
        if (shift == 0) {
            return data;
        }

        for (var i = 1; i < size; i++)
        {
            data[i - 1] = (data[i - 1] << shift) | (data[i] >> (8 - shift));
        }

        data[size - 1] <<= shift;
        return data;
    }

    GetEncryptedSize(buffer) {
        var contentSize = this.GetContentSize(buffer, true);
        var part1 = Math.floor(contentSize / this.DecryptedBlockSize);
        var part2 = (contentSize % this.DecryptedBlockSize) > 0 ? 1 : 0;

        return ((part1 + part2) * this.EncryptedBlockSize) + this.GetPacketHeaderSize(buffer);
    }

    GetContentSize(buffer, decrypted) {
        return this.GetPacketSize(buffer) - this.GetPacketHeaderSize(buffer) + (decrypted ? 1 : 0);
    }

    /**
     * Количество байт шапки, для C1 и C3 это (c1xx, c3xx) xx - длинна пакета
     * C2 и C4 имеют 2 байта на длинну пакета (xxxx)
     */
    GetPacketHeaderSize(buffer) {
        switch (buffer[0])
        {
            case 0xC1:
            case 0xC3:
                return 2;
                break;
            case 0xC2:
            case 0xC4:
                return 3;
                break;
            default:
                return 0;
        }
    }

    GetPacketSize(buffer) {
        var header = buffer[0];

        if (typeof buffer === 'string') {
            header = buffer[0] + buffer[1];
        }

        switch (header)
        {
            case 0xC1:
            case 0xC3:
                return buffer[1];
                break;
            case 0xC2:
            case 0xC4:
                // проверить << 8 в ноде
                return buffer[1] << 8 | buffer[2];
                break;
            default:
                return 0;
        }
    }

    // Gets the number of bytes to shift.
    GetShiftSize(length, shiftOffset) {
        var part1 = Math.floor((length + shiftOffset - 1) / this.DecryptedBlockSize);
        var part2 = Math.floor(shiftOffset / this.DecryptedBlockSize);

        return Math.floor(part1 + (1 - part2));
    }


    InternalEncrypt(data, startOffset, xor) {
        let xor3 = xor || this.Xor3Key;

        for (var i = 0; i < data.length - startOffset; i++)
        {
            data[i + startOffset] ^= xor3[i % 3];
        }

        return data;
    }

    InternalDecrypt32(data) {
        var headerSize = this.GetPacketHeaderSize(data);

        for (var i = data.length - 1; i > headerSize; i--)
        {
            data[i] = data[i] ^ data[i - 1] ^ this.Xor32Key[i % 32];
        }

        return data;
    }

    InternalEncrypt32(data) {
        var headerSize = this.GetPacketHeaderSize(data);

        for (var i = headerSize + 1; i < data.length; i++)
        {
            data[i] = data[i] ^ data[i - 1] ^ this.Xor32Key[i % 32];
        }

        return data;
    }

    CopyIntToArray(value, valueOffset, size) {
        var result = [];

        for (var i = valueOffset; i < valueOffset + size; i++) {
            result.push((value >> (8 * i)) & 0xFF);
        }

        return result;
    }
}


String.prototype.hexEncode = function(){
    var hex, i;

    var result = [];
    for (i=0; i<this.length; i++) {
        hex = this.charCodeAt(i).toString(16);
        result.push(parseInt(hex, 16));
    }

    return result
};

module.exports = SimpleModules;
