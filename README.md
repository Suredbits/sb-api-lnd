# sb-api-lnd
A lnd client for the suredbits api

## Install 

 This uses [ln-service](https://github.com/alexbosworth/ln-service) as the bindings to lnd
 
 There is two important environment variables that need to be set to use this API

  1. LND_CERT
  2. LND_MACAROON
  
  Alex has information on how to get access to these, copying from his README
  
  Run base64 on the tls.cert and admin.macaroon files to get the encoded
authentication data to create the LND connection. You can find these files in
the LND directory. (`~/.lnd` or `~/Library/Application Support/Lnd`)

    $ base64 tls.cert
    $ base64 data/chain/bitcoin/mainnet/admin.macaroon
    
Copy those values and add them to your `~/.bashrc` file or `~/.bash_profile` on MacOS. Your file should look something like this
    
    #need for gRPC
    export GRPC_SSL_CIPHER_SUITES='HIGH+ECDSA'
    
    #certificate, MAKE SURE NO EXTRA WHITE SPACE ADDED
    export LND_CERT=$(tr -d '[:space:]' <<< "PASTE YOUR CERT HERE")
     
    #macroon, MAKE SURE NO EXTRA WHITE SPACE ADDED
    export LND_MACAROON=$(tr -d '[:space:]' <<< "PASTE YOUR MACAROON HERE")


## Run

You should be able to start the server with

     $ npm start 
