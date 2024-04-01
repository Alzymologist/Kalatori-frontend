console.log("   ____                                         _   ____");
console.log("  |  _ \\  __ _  ___ _ __ ___   ___  _ __       | | / ___|");
console.log("  | | | |/ _` |/ _ \\ '_ ` _ \\ / _ \\| '_ \\   _  | | \\___ \\");
console.log("  | |_| | (_| |  __/ | | | | | (_) | | | | | |_| |  ___) |");
console.log("  |____/ \\__,_|\\___|_| |_| |_|\\___/|_| |_|  \\___/  |____/\n\n");

// npm install socket.io
// npm i @polkadot/api

document={
   getElementById: function() { return { innerHTML: "" }; },
   querySelector: function() { return { innerHTML: "" }; },
   querySelectorAll: function() { return []; },
};

const { exit } = require('process');
DOT = require('./DOT.js');
DOT.D={

  transferAll: async function(pair, to) { to=DOT.west(to);
    console.log(`[!] TransferAll from ${pair.west} to ${to}`);
    const transfer = DOT.api.tx.balances.transferAll(to, false);
    const hash = await transfer.signAndSend(pair);
    console.log(`[!] Transaction sent with hash: ${hash}`);
    return hash;
  },
    //  var hash = await DOT.topUpFromAlice(pay_acc,DOT.chain.total_planks);

  pay_acc: function(order) {
    var keyring = new polkadotKeyring.Keyring({ type: 'sr25519' });
    var pair = keyring.addFromMnemonic(DOT.daemon.seed)
      .derive("/"+DOT.daemon.destination)
      .derive("/"+order);
    var public = pair.publicKey;
    pair.pub0x = "0x"+Buffer.from(public).toString('hex');
    pair.west = DOT.west(pair.pub0x);
    return pair;
  },

  date: function() {
    var now = new Date();
    var year = now.getFullYear();
    var month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    var day = now.getDate().toString().padStart(2, '0');
    var hours = now.getHours().toString().padStart(2, '0');
    var minutes = now.getMinutes().toString().padStart(2, '0');
    var seconds = now.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  },

  work: async function(pair, total, order_id) {
    var pay_acc = pair.west;

    // Сперва проверим, не было ли уже оплаты
    var s = await DOT.D.read(pay_acc, BasePaid);
    if(s) {
      console.log("Already paid: "+s);
      return {result: "paid", balance: 'unknown', date: s.split(' ')[1], hash: s.split(' ')[2], payment: "old"};
    }

    // Ладно, проверим баланс
    await DOT.connect();
    var balance = await DOT.Balance(pay_acc);

    // Пишем логи
    DOT.D.save(DOT.D.date()+" "+pay_acc+" "+total+" "+order_id, BaseWait);

    if(balance < total) {
      return {result: "waiting", balance: balance};
    }

    var s = await DOT.D.read(pay_acc, BasePaid);
    if(s) {
        console.log("Already paid: "+s);
        return {result: "paid", balance: balance, date: s.split(' ')[1], hash: s.split(' ')[2], payment: "paid"};
    }

    var s = await DOT.D.read(pay_acc, BaseTran);
    if(s) {
        console.log("Already transfered: "+s);
        return {result: "paid", balance: balance, date: s.split(' ')[1], payment: "process"};
    }

    // Опа, оплата готова, начинаем трансфер
    console.log("READY! Balance transfering: "+balance);

    // Пометить в тран-базе
    var s = pay_acc+" "+DOT.D.date()+" "+total+" "+order_id;
    DOT.D.save(s, BaseTran);
    // Начать трансфер
    var hash = await DOT.D.transferAll(pair, DOT.daemon.destination);
    console.log("Now transfered, hash: "+hash);
    // Пометить в пейд-базе
    var s = pay_acc+" "+DOT.D.date()+" "+total+" "+hash+" "+order_id;
    DOT.D.save(s, BasePaid);

    return {result: "paid", balance: balance, date: s.split(' ')[1], hash: s.split(' ')[2], payment: "new"};
  },


  save: async function(data, file) { if(!file) file = BaseWait;
    const key = data.split(' ')[0];
    const s = await DOT.D.read(key, file);
    if(s) return false;
    fs.appendFile(file, data+"\n", 'utf-8', err => { if(err) { throw err; } });
    return true;
  },

  read: async function(key, file) { if(!file) file = BaseWait;
    return new Promise((resolve, reject) => {
        if(!fs.existsSync(file)) resolve(false);
        const fileStream = fs.createReadStream(file);
        const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
        var ret = false;
        rl.on('line',(line) => { if(line.startsWith(key+' ')) { ret = line; rl.close(); } });
        rl.on('close',() => { resolve(ret); });
        rl.on('error',() => { resolve(false); });
    });
  },

};

console.log("Loading environment variables");

DOT.chain.total = 2;
DOT.chain.wss = DOT.daemon.wss = process.env['KALATORI_RPC']; // "wss://node-polkadot.zymologia.fi:443"
DOT.daemon.server = process.env['KALATORI_HOST']; // "0.0.0.0:16726"
DOT.daemon.seed = process.env['KALATORI_SEED']; // "bottom drive obey lake curtain smoke basket
DOT.daemon.destination = process.env['KALATORI_DESTINATION']; // "0x7a8e3cbf653a65077179947e250892e579c8fb39167ec1ce26a4a6acbc5a0365"
DOT.daemon.mulx = process.env['KALATORI_DECIMALS']; // 10
DOT.daemon.mul = 10**process.env['KALATORI_DECIMALS']; // 1000000000
"wss server seed destination mul".split(" ").forEach((v) => {
    console.log("\t"+v+" = "+DOT.daemon[v]);
});

polkadotUtil = require('@polkadot/util');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
polkadotApi = require("@polkadot/api");
polkadotKeyring = require('@polkadot/keyring');

(async () => { // Load all crypto
    await cryptoWaitReady();
    // await waitReady();
    console.log("Connect to: "+DOT.chain.wss);
    await DOT.chain_info();
      console.log("\t symbol = "+DOT.chain.symbol);
      console.log("\t deposit = "+DOT.chain.deposit);
      console.log("\t fee = "+DOT.chain.fee+" ("+DOT.chain.fee_planks+")");
      console.log("\t ss58 = "+DOT.chain.ss58);
      console.log("\t mul = "+DOT.daemon.mul);
})();

// File system
const fs = require('fs');
const readline = require('readline');
const BaseWait = 'base_wait.txt';
const BasePaid = 'base_paid.txt';
const BaseTran = 'base_tran.txt';

const express = require("express");
const { createServer } = require("http");
const { parse } = require("path");
const { Server } = require("socket.io");

let app = express();
const port = DOT.daemon.server.split(':')[1]; // "0.0.0.0:16726"// 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/*", async (req, res) => {
  console.log("New connect: "+req.url);

  var answer = {
      wss: DOT.chain.wss,
      version: "1.02 nodeJS LLeo",
      recipient: DOT.daemon.destination,
      symbol: DOT.chain.symbol,
      deposit: DOT.chain.deposit,
      fee_planks: DOT.chain.fee_planks,
      ss58: DOT.chain.ss58,
      mul: DOT.daemon.mulx,
  };

  // Error test
  var url = req.url.split("/");
  if(url[1]!='order'|| url[3]!='price'){
    answer.error = "Invalid URL";
    res.status(200).send(answer);
    return;
  }

  answer.price = 1*url[4];
  answer.order = url[2];
  var pair = DOT.D.pay_acc(answer.order);
  answer.pay_account = pair.west; // pub0x;

  if(answer.price <= 0) answer.result = 'waiting';
  else {
    var r = await DOT.D.work(pair, answer.price, answer.order);
    for(var i in r) answer[i] = r[i];
  }
  res.status(200).send(answer);
});

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*", methods: ["GET", "POST"],} });

io.on("connection", (socket) => {
  console.log("We are live and connected");
  console.log(socket.id);
});

httpServer.listen(port, () => {
  console.log(`Starting server: http://localhost:${port}\n\n`);
});