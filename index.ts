import { Wallet } from "@project-serum/anchor";
import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import axios from "axios";
import  bs58  from "bs58";
import dotenv from "dotenv"


dotenv.config();

const privatekey=process.env.PRIVATE_KEY;
if(!privatekey){
    throw new Error("no private key bro")
}


//my rpc url
//for conncetion 
const connection =new Connection("https://api.mainnet-beta.solana.com");

const wallet=new Wallet(Keypair.fromSecretKey(bs58.decode(privatekey)));

async function createswap(){
    const response=await (
        await axios.get('https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=100000000&slippageBps=50')
    );

    const quoteresponse=response.data;
    console.log(quoteresponse);

        try {
            const {data:{swapTransaction}}=await (
                await axios.post('https://quote-api.jup.ag/v6/swap',{
               quoteresponse,
                userPublicKey:wallet.publicKey.toString()
                })
            )  ;


            console.log("swap transaction")

            const swapTransactionbuffer=Buffer.from(swapTransaction,'base64');
            var transaction=VersionedTransaction.deserialize(swapTransactionbuffer);

            console.log(transaction);

            transaction.sign([wallet.payer]);

            //lastest blockhash
            const lastesblockhasgh=await connection.getLatestBlockhash();
            
            //excute the transaction
            const rawTransaction=transaction.serialize();
            //transaction id
            const txid=await connection.sendRawTransaction(rawTransaction,{
                skipPreflight:true,
                maxRetries:2
            })

            await connection.confirmTransaction({
                blockhash:lastesblockhasgh.blockhash,
                lastValidBlockHeight:lastesblockhasgh.lastValidBlockHeight,
                signature:txid
            })
             console.log(`https://solscan.io/tx/${txid}`);


        } catch (error) {
            console.log(error)
        }

}

createswap();