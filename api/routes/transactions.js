const express = require('express');
const router = express.Router();
require('dotenv').config(); 
const Web3 = require('web3')
const Tx = require('ethereumjs-tx').Transaction
const Common = require('ethereumjs-common')
const web3 = new Web3('https://data-seed-prebsc-1-s1.binance.org:8545')
const privateKey = Buffer.from(process.env.privateKey, 'hex');
const mongoose = require('mongoose');
const Transaction = require('../models/transaction');
const nodemailer = require('nodemailer')

router.post('/transaction', async (req, res, next) => {

    try {
        const { sender,  receiver , value, email } = req.body;
        if (!(email && sender && receiver && value)){
            res.status(400).send('All input field is requried!');
        }else{
            const em = email.match( /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/)
            if(!(em)){
                res.send('Invalid Email')
            }else { 
                web3.eth.getTransactionCount(sender, (err, txCount) => {
    
                    // Build the Transaction
                    const txObject = {
                        nonce : web3.utils.toHex(txCount),
                        to : receiver,
                        value: web3.utils.toHex(web3.utils.toWei(value, 'ether')),
                        gasLimit : web3.utils.toHex(21000),
                        gasPrice : web3.utils.toHex(web3.utils.toWei('10', 'gwei'))
                    }
                
                    const common = Common.default.forCustomChain('mainnet', {
                        name: 'bnb',
                        networkId: 97,
                        chainId: 97
                      }, 'petersburg');
        
                    //Sign the Transaction
                    const tx = new Tx(txObject, {common})
                    tx.sign(privateKey)
                
                    const serializedTransaction =tx.serialize()
                    const raw ='0x'+serializedTransaction.toString('hex')
                
                     //Broadcast the Transaction
                    web3.eth.sendSignedTransaction(raw, (err,txHash) => {
                        console.log('err:', err)
                        console.log('txHash:', txHash)
                       
                        const transaction = new Transaction({
                            _id : new mongoose.Types.ObjectId,
                            email : req.body.email,
                            sender : req.body.sender,
                            receiver : req.body.receiver,
                            value : req.body.value,
                            gasLimit : txObject.gasLimit,
                            gasPrice : txObject.gasPrice,
                            Hash : txHash
                        })
        
                        const mail = nodemailer.createTransport({
                            service: 'gmail',
                            auth:{
                                user:process.env.USER,
                                pass:process.env.PASSWORD    
                            }
                        });
                        
                        const mailOptions = {
                            from: process.env.USER,
                            to: email,
                            subject: `Your Binance Transaction success!`,
                            html: `<!doctype html>
                            <html lang="en">
                              <head>
                                <!-- Bootstrap CSS -->
                                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.1/dist/css/bootstrap.min.css" integrity="sha384-zCbKRCUGaJDkqS1kPbPd7TveP5iyJE0EjAuZQTgFLD2ylzuqKfdKlfG/eSrtxUkn" crossorigin="anonymous">
                                <title>Hello, world!</title>
                                <style>
                                    .container{
                                        margin-top: 3%;
                                        /* text-align: center; */
                                        border-radius: 10px;
                                        border: 3px solid #F0B90B;
                                        padding: 10px;
                                        position: fixed;
                                        top: 0;
                                        right: 0;
                                        left: 0;
                                        /* height: 46px; */
                                        z-index: 100;
                                    }
                                    .header{
                                        display: flex;
                                        margin-right: 20px;
                                        margin-left: 20px;
                                    }
                                    h1{
                                        display: inline;
                                    }
                                    h4{
                                        display: inline;
                                        float:right;
                                        font-weight: 400;
                                        font-size: 20px;
                                        margin-top: 25px;
                                    }
                                    .main{
                                        /* display: flexbox; */
                                        background-color: #f7f9fa;
                                        padding: 10px;
                                        margin-top: 30px;
                                    }
                                    table{
                                        margin-top: 20px;
                                    }
                                </style>
                              </head>
                              <body>
                                <div class="container">
                                   <header>
                                       <img src="https://cryptologos.cc/logos/binance-coin-bnb-logo.png" alt="Ethereum logo" height="70" width="70">
                                       <h4>${Date()}</h4>
                                   </header>
                                   <div class="container-fluid">
                                       <div class="main">
                                            <b>Your Binance Transaction success!</b>
                                            <table class="table">
                                                <tr>
                                                    <td>Tnx. ID </td>
                                                    <td>: &nbsp;${transaction._id}</td>
                                                </tr>
                                                <tr>
                                                    <td>Tnx. Status </td>
                                                    <td style="color: #34a853;">: &nbsp; Successful</td>
                                                </tr>
                                                <tr>
                                                    <td>Sender Address </td>
                                                    <td>: &nbsp; ${sender}</td>
                                                </tr>
                                                <tr>
                                                    <td>Receiver Address </td>
                                                    <td>: &nbsp; ${receiver}</td>
                                                </tr>
                                                <tr>
                                                    <td>Amount </td>
                                                    <td>: &nbsp; ${value}</td>
                                                </tr> 
                                                <tr>
                                                    <td>Gas Limit </td>
                                                    <td>: &nbsp; ${transaction.gasLimit}</td>
                                                </tr> 
                                                <tr>
                                                    <td>Gas Price </td>
                                                    <td>: &nbsp; ${transaction.gasPrice}</td>
                                                </tr> 
                                                <tr>
                                                    <td>Tnx.Hash </td>
                                                    <td>: &nbsp; https://testnet.bscscan.com/address/${txHash}</td>
                                                </tr> 
                                            </table>
                                       </div>
                                       <div class="wrapper">
                                           <p>Hi ${req.body.name}</p>
                                           <p>If you have not made this transaction or notice any error please contact us at <a href=" https://support.rutikkhalkar.com"> https://support.rutikkhalkar.com</a> </p>
                                           <p>Cheers! <br>
                                            Team Binance
                                           </p>
                                       </div>
                                   </div>
                                </div>
                            
                            
                                <!-- Option 1: jQuery and Bootstrap Bundle (includes Popper) -->
                                <script src="https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.slim.min.js" integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj" crossorigin="anonymous"></script>
                                <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.1/dist/js/bootstrap.bundle.min.js" integrity="sha384-fQybjgWLrvvRgtW6bFlB7jaZrFsaBXjsOMm/tB9LTS58ONXgqbR9W8oWht/amnpF" crossorigin="anonymous"></script>
                            
                              </body>
                            </html>`
                           
                        };
                    
                        mail.sendMail(mailOptions, function(error, info){
                            if (error) {
                                console.log(error);
                            }
                            else{
                                console.log('Email sent: ' + info.response);
                            }
                        });
        
                        try {
                            const t1 = transaction.save()
                            
                            res.status(200).json({
                                Message : 'Transaction save and successfully!',
                                transaction,
                            }) 
                        } catch (error) {
                            res.status(404).json({
                                Message :'Unable to save transaction :',
                                error
                            })
                        }
                    })
                })
            }
        }
    } catch (error) {
        res.status(401).json({
            message:'Transaction failed!',
            error
        })
    }
})

module.exports = router;