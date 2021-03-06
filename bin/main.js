const RpcAgent = require('bcrpc');
agent = new RpcAgent({port: 18332, user: 'test', pass: 'test'});

const ecc = require('tiny-secp256k1')
const { generateMnemonic, mnemonicToSeedSync } = require('bip39')
const { BIP32Factory } = require('bip32')
const { payments, Psbt, bip32, networks, script, opcodes } = require("bitcoinjs-lib");
const {User} = require("../models/user")
const {Heir} = require("../models/heir")

const { fromSeed} = BIP32Factory(ecc)
const network = networks.testnet;

const CreateMnemonic = function() {
    try {
    
        async function generatexpub() {
            console.log("see me")
            // const findUser = await User.find();
            console.log("here too")
            const derivationPath = "m/48'/1'/0'/2'"; // P2WSH(testnet)

            // if(findUser.length < 1){    
                // const mnemonic = generateMnemonic(256)
                const mnemonic = 'enlist organ trial depart remain super race betray axis net nice skate pelican liquid build annual skill summer claw street stick motor witness sphere'
                const seed = mnemonicToSeedSync(mnemonic)

                let privateKey = fromSeed(seed, network)
                let xpriv = privateKey.toBase58()
                let privKey = privateKey.privateKey
                const masterFingerprint = privateKey.fingerprint;
                const child = privateKey.derivePath(derivationPath).neutered()
                const xpub = child.toBase58();
                console.log('privKey', privKey)
                console.log(privKey.toString('hex'))

            //     const user = new User({
            //         mnemonic: mnemonic,
            //         privateKey: privateKey,
            //         masterFingerprint: masterFingerprint,
            //         xpriv: xpriv,
            //         xpub: xpub
            //     })
            //    await user.save()
            //    return;     
            // } else {
            //     console.log("You have already created your mnemonic!")
            // }
            return;
        }
        generatexpub()
    } catch (error) {
        console.log(error.message)
    }
}

// const CreateHeir = function() {
//     try {
    
//         async function generatexpub() {
//             const findUser = await Heir.find();
//             const derivationPath = "m/48'/1'/0'/2'"; // P2WSH(testnet)

//             if(findUser.length < 1){    
//                 const mnemonic = generateMnemonic(256)
//                 const seed = mnemonicToSeedSync(mnemonic)

//                 const privateKey = fromSeed(seed, network)
//                 let xpriv = privateKey.toBase58()
//                 privateKey.privateKey
//                 const masterFingerprint = privateKey.fingerprint;
//                 const child = privateKey.derivePath(derivationPath).neutered()
//                 const xpub = child.toBase58();

//                 const heir = new Heir({
//                     mnemonic: mnemonic,
//                     privateKey: privateKey,
//                     masterFingerprint: masterFingerprint,
//                     xpriv: xpriv,
//                     xpub: xpub
//                 })
//                await heir.save()
//                return;     
//             } else {
//                 console.log("You have already created your mnemonic!")
//             }
//             return;
//         }
//         generatexpub()
//     } catch (error) {
//         console.log(error.message)
//     }
// }


function generateScript(childPubkey, heirChildPubkey) {
    const witnessScript = script.compile([
        opcodes.OP_PUSHDATA1,
        33,
        childPubkey,
        opcodes.OP_CHECKSIG,
        opcodes.OP_IFDUP,
        opcodes.OP_NOTIF,
        opcodes.OP_PUSHDATA1,
        33,
        heirChildPubkey,
        opcodes.OP_CHECKSIGVERIFY,
        opcodes.OP_PUSHDATA1,
        3,
        "9af040",
        opcodes.OP_CSV,
        opcodes.OP_ENDIF
    ]);
    console.log(witnessScript)
    return witnessScript;
}


const createAddress = function() {

    try {
        const heirXpub = String(process.argv[3])
        console.log(heirXpub)
        if(heirXpub === undefined) {
            console.log("Error! please enter your heir's extended public key after the 'createaddress' command")
            throw Errorr
        } else{

            async function generateAddress() {
                const findUser = await User.find()
                const addresses = findUser[0].addresses
                console.log(addresses.length)
                const num = addresses.length >1? addresses.length-=1 : 1
                console.log(num)
                const derivationPath = `0/${num}`
                console.log(findUser)
                if(findUser.length < 1) {
                    console.log("You have to create your mnemonics first! Use the 'createmnemonic' command to do this.")
                    return;
                  } else {
                    xpub = findUser[0].xpub;
                    console.log(xpub)
                    const node = bip32.fromBase58(xpub, network)
                    console.log(node)
                    const childPubkey =  node.derivePath(derivationPath).publicKey
                    // console.log("ChildPubKey: ", childPubkey.toString('58'))
                    const heirNode = bip32.fromBase58(heirXpub, network)
                    const heirChildPubkey = heirNode.derivePath(derivationPath).publicKey
                    console.log("HeriPubKey: ", heirChildPubkey)

                    let witnessScript = generateScript(childPubkey, heirChildPubkey);


                    const address = payments.p2wsh({
                        pubkeys: [childPubkey, heirChildPubkey],
                        redeem: { output: witnessScript, network: networks.testnet },
                        network: networks.testnet,
                    });

                    witnessScript = witnessScript.toString('hex')
                    console.log(address, witnessScript);
                    findUser[0].addresses = {address, witnessScript};
                    findUser[0].save()
                    return;
                }
            }
            generateAddress()
        }
    }catch (error) {
        console.log(error)
    }
}

async function generateChilPubKey() {
    const user = await Heir.find()
    const addresses = user[0].addresses
    const num = addresses.length >1? addresses.length-=1 : 1
    const derivationPath = `0/${num}`
    console.log(user)
    if(user.length < 1) {
        console.log("You have to create your mnemonics first! Use the 'createmnemonic' command to do this.")
        return;
    } else {
        xpub = user[0].xpub;
        console.log(xpub)
        const node = bip32.fromBase58(xpub, network)
        const child = node.derivePath(derivationPath)
        const childPublickey = child.publicKey;
        console.log("child", child.toBase58());
        console.log("pubkey", childPublickey.toString('hex'));
        user[0].childPubKey = child
        await user[0].save()
        return [child, childPublickey]
    }
}



// const txScript = function() {
//     async function csvCheckSigOutput(xpub, heirXpub, lockTime) {
//         const findUser = await User.find()
//         xpub = findUser[0].xpub
    
//         const derivationPath = "0/0"
//         const findHeir = await Heir.find()
//         heirXpub = findHeir[0].xpub
//         const node = bip32.fromBase58(xpub, network)
//         const child = node.derivePath(derivationPath)
//         const heirNode = bip32.fromBase58(heirXpub, network)
//         const heirChild = heirNode.derivePath(derivationPath)

//         lockTime = 365; 
//         const address = payments.p2wsh({
//             pubkeys: [child.publicKey, bobKey],
//             redeem: { output: witnessScript, network: networks.testnet },
//             network: networks.testnet
//           });
//         console.log(add)
//         return
//     }
//     csvCheckSigOutput()
    
// }




// module.exports = {CreateMnemonic, createAddress, CreateHeir};
module.exports = {CreateMnemonic};
