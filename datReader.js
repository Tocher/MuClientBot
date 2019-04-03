var fs = require('fs');

//fs.readFile('CheckSum.dat', (err, data) => {
//    if (err) throw err;
//
//    console.log(data.slice(0, 4));
//    console.log(data.readUInt32BE(0).toString(16));
//
//
//
//});

fs.readFile('main.exe', (err, data) => {
    if (err) throw err;

    var index = 0;

    var result = index << 9;

    for (var i = 0; i < data.length; i+=4) {
        var key = data.readUInt16LE(i);

        switch(((i>>2) + index) % 3) {
            case 0:
                result ^= key;
                break;
            case 1:
                result += key;
                break;
            case 2:
                result = result << (key % 11);
                result ^= key;
                break;
        }
        result ^= (index + result) >> ((i>>2) % 16 + 3);
    }

    console.log(result.toString(16));
});


//uint dwResult = (uint)wChecksumKey << 9;
//for (uint I = 0; I < filesize; I += 4)
//{
//    uint dwKey = MakeDword(lpFileBuffer, I);
//    switch (((I >> 2) + wChecksumKey) % 3)
//    {
//        case 0:
//            dwResult ^= dwKey;
//            break;
//        case 1:
//            dwResult += dwKey;
//            break;
//        case 2:
//            dwResult = dwResult << (int)(dwKey % 11);
//            dwResult ^= dwKey;
//            break;
//    }
//    dwResult ^= (wChecksumKey + dwResult) >> (int)((I >> 2) % 16 + 3);
//}
//return dwResult;

//86 00 ac 16
//fa b2 2c ca
//f4 db c8 eb
//e6 ba 25 cf
