console.log("   ____                                         _   ____");
console.log("  |  _ \\  __ _  ___ _ __ ___   ___  _ __       | | / ___|");
console.log("  | | | |/ _` |/ _ \\ '_ ` _ \\ / _ \\| '_ \\   _  | | \\___ \\");
console.log("  | |_| | (_| |  __/ | | | | | (_) | | | | | |_| |  ___) |");
console.log("  |____/ \\__,_|\\___|_| |_| |_|\\___/|_| |_|  \\___/  |____/\n\n");

// npm install socket.io
// npm i @polkadot/api


var supported_currencies=[
  {
    "currency": "DOT",
    "chain_name": "polkadot",
    "kind": "native",
    "decimals": 10,
    "rpc_url": "wss://rpc.polkadot.io"
  },
  {
    "currency": "USDT",
    "chain_name": "assethub-polkadot",
    "kind": "asset",
    "asset_id": 1984,
    "decimals": 6,
    "rpc_url": "wss://assethub-polkadot-rpc.polkadot.io"
  },
  {
    "currency": "USDC",
    "chain_name": "assethub-polkadot",
    "kind": "asset",
    "asset_id": 1337,
    "decimals": 6,
    "rpc_url": "wss://assethub-polkadot-rpc.polkadot.io"
  }
];

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
    try {
        const hash = await transfer.signAndSend(pair);
	      console.log(`[!] Transaction sent with hash: ${hash}`);
	      return hash;
    } catch(er) {
	      console.log(`[!] Error transaction: ${er}`);
    }
    return false;
  },
    //  var hash = await DOT.topUpFromAlice(pay_acc,DOT.chain.total_planks);

  pay_acc: function(order) {
   try {
    var keyring = new polkadotKeyring.Keyring({ type: 'sr25519' });
    var pair = keyring.addFromMnemonic(DOT.daemon.seed)
      .derive("/"+DOT.daemon.destination)
      .derive("/"+order);
    var public = pair.publicKey;
    pair.pub0x = "0x"+Buffer.from(public).toString('hex');
    pair.west = DOT.west(pair.pub0x);
   } catch(er) {
    	console.log(`[!] Error: ${er}`);
	    return false;
   }
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
      console.log("Already paid (BasePaid): "+s);
      return {result: "paid", date: s.split(' ')[1], amount: s.split(' ')[2], hash: s.split(' ')[3], payment: "old"};
    }

    // Ладно, проверим баланс
    try {
	      await DOT.connect();
	      var balance = await DOT.Balance(pay_acc);
    } catch(er) {
	      return {error: ''+er};
    }
    // Пишем логи
    DOT.D.save(DOT.D.date()+" "+pay_acc+" "+total+" "+order_id, BaseWait);

    if(balance < total) {
      return {result: "waiting", balance: balance};
    }

    var s = await DOT.D.read(pay_acc, BaseTran);
    if(s) {
        console.log("Already transfered (BaseTran): "+s);
        return {result: "paid", balance: balance, date: s.split(' ')[1], amount: s.split(' ')[2], payment: "process"};
    }

    // Опа, оплата готова, начинаем трансфер
    console.log("READY! Balance transfering: "+balance);

    // Пометить в тран-базе
    var s = pay_acc+" "+DOT.D.date()+" "+total+" "+order_id;
    DOT.D.save(s, BaseTran);
    // Начать трансфер
    try {
        var hash = await DOT.D.transferAll(pair, DOT.daemon.destination);
        console.log("Now transfered, hash: "+hash);
        // Пометить в пейд-базе
        var s = pay_acc+" "+DOT.D.date()+" "+total+" "+hash+" "+order_id;
        DOT.D.save(s, BasePaid);
    } catch(er) {
	      return {error: ''+er};
    }

    return {result: "paid", balance: balance, date: s.split(' ')[1], amount: s.split(' ')[2], hash: s.split(' ')[3], payment: "new"};
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
DOT.daemon.remark = process.env['KALATORI_REMARK'];
"wss server seed destination mul remark".split(" ").forEach((v) => {
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


var server_info={
  version: "2.01 nodeJS LLeo",
  instance_id: "cunning-garbo",
  debug: true,
  kalatori_remark: DOT.daemon.remark,
  other: {
    wss: DOT.chain.wss,
    recipient: DOT.daemon.destination,
    symbol: DOT.chain.symbol,
    deposit: DOT.chain.deposit,
    fee_planks: DOT.chain.fee_planks,
    ss58: DOT.chain.ss58,
    mul: DOT.daemon.mulx,
  }
};


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

// https://alzymologist.github.io/kalatori-api/
//                           _
//         ___    _ __    __| |   ___   _ __
//        / _ \  | '__|  / _` |  / _ \ | '__|
//       | (_) | | |    | (_| | |  __/ | |
//        \___/  |_|     \__,_|  \___| |_|
//
app.get("/v2/order/*", async (req, res) => {

    // Ещё какая-то йобань неизвестная
    if(req.url.split("/")[4] == "forceWithdrawal") {
        return res.status(200).send({result: "OK" });
    }

    // блять наркоманы,  половина данных GET, половина POST, как хуй на душу влезет
    var order = req.url.split("/")[3]; // ID of order to track payments for
    var amount = 1*req.query.amount; // (in selected currency; not in Plancks) This parameter can be skipped on subsequent requests
    var currency = req.query.currency; // Currency (human-readable ticker, one of the values listed in the /status::supported_currencies) If no currency is specified, but amount is present, server will return error 400.
    var currency_block = supported_currencies.find((v) => v.currency == currency);
    var callback = req.query.callback; // "Меньше всего нужны мне твои каллбэки" (с) Земфира
    var status = 443;

    // Делаем наши проверки
    var error = [];
    if(!amount) error.push({"parameter": "amount", "message": "'amount' can't be blank if 'currency' is specified"});
    if(!currency_block) error.push({"parameter": "currency", "message": "Currency is not not supported"});
    if(error.length) return res.status(400).send(error);

    // Делаем наши дела
    var pair = DOT.D.pay_acc(order);
    var payment_account = pair.west;
    var r = await DOT.D.work(pair, amount, order);

    // Проверяем amount
    if(r.amount != amout) status = 409; // processed with different parameters (amount/currency), and cannot be updated
    else {
      if(r.payment == "old" || r.payment == "process" || r.payment == "new") status = 200; // exists
      else if(!r.payment) status = 201; // created
    }

res.status(status).send({
    hash: r.hash, // added by lleo
  server_info: server_info,
	order: order,
	payment_status: (r.result=='waiting' ? "pending" : "paid"), // "Мы не можем похвастаться мудростью глаз и умелыми жестами рук" (с) Цой
	"withdrawal_status": "waiting", // А ебитесь сами конями
	payment_account: payment_account,
	amount: amount,
	currency: currency_block,
	callback: callback,
	recipient: DOT.daemon.destination,
	"transactions": [
	  {
	    "block_number": 123456,
	    "position_in_block": 1,
	    timestamp: r.date.replace(/^(\d\d\d\d\-\d\d\-\d\d)\_(\d\d)\-(\d\d)\-(\d\d)$/g,"$1T$2:$3:$4Z"), // "2021-01-01T00:00:00Z",
	    "transaction_bytes": "0x1234567890abcdef",
	    "sender": "14Gjs1TD93gnwEBfDMHoCgsuf1s2TVKUP6Z1qKmAZnZ8cW5q",
	    recipient: payment_account,
	    amount: amount,
	    currency: currency_block,
	    status: (r.payment == "old" || r.payment == "new" ? "finalized" : "pending"),
    }
	  ],
  });
});


//          _             _
//    ___  | |_    __ _  | |_   _   _   ___
//   / __| | __|  / _` | | __| | | | | / __|
//   \__ \ | |_  | (_| | | |_  | |_| | \__ \
//   |___/  \__|  \__,_|  \__|  \__,_| |___/
//
app.get("/v2/status", async (req, res) => {
    res.status(200).send({
      server_info: server_info,
      supported_currencies: supported_currencies,
    });
});

//      _                      _   _     _
//     | |__     ___    __ _  | | | |_  | |__
//     | '_ \   / _ \  / _` | | | | __| | '_ \
//     | | | | |  __/ | (_| | | | | |_  | | | |
//     |_| |_|  \___|  \__,_| |_|  \__| |_| |_|
//
app.get("/v2/health", async (req, res) => {
    var a={}; for(var x of supported_currencies) { if(!a[x.rpc_url]) a[x.rpc_url]=x.chain_name; }
    var connected_rpcs=[]; for(var x in a) connected_rpcs.push({ rpc_url:x, chain_name:a[x], status: "ok" });
    res.status(200).send({
	server_info: server_info,
	connected_rpcs: connected_rpcs,
	status: "ok"
    });
});









app.get("/*", async (req, res) => {
  console.log("\n--------------------------\nNew user: "+req.url);

  var answer = {
      wss: DOT.chain.wss,
      version: "1.03 nodeJS LLeo",
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