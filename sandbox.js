var Decryptor = require('./decryptor');
var dec = new Decryptor();

var packet = new Buffer.from('c33cf1f0a37d3c8cfaf96bafbc18c978e9c100c43c302af1e47654781fdd520903734aa16addc5286410a30b26b42aea4b36ef49f4c7ec7567eecab7', 'hex');

//console.log(dec.DecryptC3(packet));

var r = dec.DecryptC3(packet);

decryptLogin(dec.InternalDecrypt32(r));

function decryptLogin(dec2) {
    var login = dec2.slice(4, 14);
    var pass = dec2.slice(14, 34);

    console.log(toHex(dec2[0]));
    console.log(toHex(dec2[1]), 'size');
    console.log(toHex(dec2[2]), 'code');
    console.log(toHex(dec2[3]), 'subcode');
    console.log(dec.InternalEncrypt(login, 0).toString());
    console.log(dec.InternalEncrypt(pass, 0).toString());
    console.log(toHex(dec2.slice(34, 38)), 'count');
    console.log(toHex(dec2.slice(38, 43), ','));
    console.log(hex2a(toHex(dec2.slice(38, 43), 'nospace')), 'version');
    console.log(hex2a(toHex(dec2.slice(43, 59), 'nospace')), 'serial');
}




function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
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
