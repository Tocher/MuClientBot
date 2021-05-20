var net = require('net');

const MausMu2 = '176.99.158.82';
const MausMu = '180.148.130.250';
const goldMu = '151.80.28.49';
// const MausMu = '85.119.149.160';

//const CONNECT_SERVER_PORT = 44405;
const CONNECT_SERVER_PORT = 56900;

// connectServer.connect(44405, goldMu, function (data) {
//     console.log('Connected');
// });
//
// connectServer.on('data', function (data) {
//     console.log('Received: ' + data.toString('hex'));
// });

//47000
// 56000 for MausMu
checkPort(44400);

function checkPort(port) {
    if (port % 100 === 0) {
        console.log('Cheching:', port);
    }

    let connectServer = new net.Socket();

    connectServer.connect(port, MausMu2, function (data) {
        console.log('Connected', port);
    });

    connectServer.on('data', function (data) {
        console.log('Received: ' + data.toString('hex'));
    });

    // connectServer.on('error', function (data) {
    //     console.log('a', port);
    // });

    setTimeout(() => {
        connectServer.destroy();

        checkPort(port + 1)
    }, 100);
}

function checkIsConnecting(socket) {
    if (socket.connecting) {
        console.log(socket.connecting);
        setTimeout(() => {
            checkIsConnecting(socket);
        }, 100);
    } else {

    }
}
