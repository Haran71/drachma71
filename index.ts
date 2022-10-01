import * as crypto from 'crypto';

class Transaction {
    constructor(
        public amount: number,
        public payer: string,
        public payee: string,
    ) {}

    toString(){
        return JSON.stringify(this);
    }
}

class Block{

    public nonce = Math.round(Math.random() * 999999999);

    constructor (
        public prevHash: string | null,
        public transaction: Transaction,
        public ts = Date.now()
    ) {}

    get hash(){
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');

        hash.update(str).end();

        return hash.digest('hex');
    }
}

class Chain {
    public static instance = new Chain(); // to ensure only one instance of the Chain class

    chain: Block[];

    constructor() {
        this.chain = [new Block(null, new Transaction(100,'genesis', 'satoshi'))];
    }

    get lastBlock(){
        return this.chain[this.chain.length - 1];
    }

    mine(nonce: number){
        let solution = 1;
        console.log("Mining...");

        while(true){
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();

            const attempt = hash.digest('hex');
            if(attempt.substring(0,4) === "0000"){
                console.log(`Solved: ${solution}`);
                return solution;
            }
            solution++;
        }

    }

    addBlock (transaction: Transaction, senderPublicKey: string, signature: Buffer){
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());

        const isValid = verifier.verify(senderPublicKey,signature);

        if(isValid){
            const newBlock = new Block(this.lastBlock.hash,transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }
        
    }

}

class Wallet {
    public publicKey: string;
    public privateKey: string;

    constructor(){
        
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: "spki", format: 'pem'},
            privateKeyEncoding: {type: "pkcs8", format:'pem'},
        });

        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;

    }

    sendMoney(amount: number, payeePublicKey: string){
        const transaction = new Transaction(amount, this.publicKey,payeePublicKey);
        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();

        const signature = sign.sign(this.privateKey);

        Chain.instance.addBlock(transaction,this.publicKey,signature);
    }

}


// Example usage

const Bala = new Wallet();
const Arnav = new Wallet();
const Haran = new Wallet();


Haran.sendMoney(30,Bala.publicKey);
Arnav.sendMoney(45,Bala.publicKey);
Bala.sendMoney(69,Haran.publicKey);

console.log(Chain.instance);