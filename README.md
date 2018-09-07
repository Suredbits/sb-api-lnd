# sb-api-lnd
A lnd client for the [suredbits api](https://suredbits.com/api/)

:zap: radically low fees :zap: nano payments :zap: instant confirmations :zap:

# Getting dependencies

You need to install [Node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/get-npm).

### Ubuntu 18.04

```bash
$ sudo apt update
$ sudo apt install nodejs npm
```

### Ubuntu 16.04

```bash
$ curl -sL https://deb.nodesource.com/setup_8.x -o - | sudo bash
$ sudo apt install nodejs
```

### macOS

This guide assumes you have [Xcode](https://developer.apple.com/xcode/) and [Homebrew](https://brew.sh/) installed.

```bash
$ brew install node # installs npm as well
```

---

## `bitcoind` installation and setup instructions

We need [`bitcoind`](https://github.com/bitcoin/bitcoin), for downloading and interacting with the Bitcoin blockchain.

As of the time of this writing, the bitcoin testnet will take ~25GB of space on your computer's hard drive.

### Ubuntu

```bash
$ sudo add-apt-repository ppa:bitcoin/bitcoin
$ sudo apt update
$ sudo apt install bitcoind
```

### macOS

```
$ brew install bitcoin
```

Downloading and verifying the Bitcoin blockchain is going to take a while, so you should start that right away.

First, edit your `bitcoind` configuration file called `bitcoin.conf`. Here is a table to show you where this file should be located based on your OS. If there isn't a file that exists there already, create one.

```
Operating System 	Default bitcoin datadir 	                 Typical path to configuration file

Windows 	        %APPDATA%\Bitcoin\ 	                         C:\Users\username\AppData\Roaming\Bitcoin\bitcoin.conf

Linux 	                $HOME/.bitcoin/ 	                         /home/username/.bitcoin/bitcoin.conf

Mac OSX 	        $HOME/Library/Application Support/Bitcoin/ 	 /Users/username/Library/Application Support/Bitcoin/bitcoin.conf
````
You need to create a rpc username and password inside of your bitcoin.conf file

```
daemon=1
testnet=1
txindex=1
rpcuser=REPLACEME
rpcpassword=REPLACEME
```

For more information on configuring bitcoind please see [this](https://en.bitcoin.it/wiki/Running_Bitcoin) page

Start `bitcoind`:

```bash
$ bitcoind 
```

`bitcoind` will now sync the blockhain. This will take a while, typically several hours. You can inspect the log to ensure that progress is made. Depending on where your `bitcoin.conf` file is, you can watch your node sync by using `tail`. For example, on macOS you can do:

```bash
$ tail -f $HOME/Library/Application Support/Bitcoin/testnet3/debug.log
```


# Installing lnd


  Please see the [installation instructions](https://github.com/lightningnetwork/lnd/blob/master/docs/INSTALL.md) on the lnd repo


## Opening a channel

    To get some free testnet coins, generate a new address and paste it in at the [TestNet Bitcoin Sandbox](https://testnet.manu.backend.hamburg/faucet):

    $ cd $GOPATH/src/github.com/lightningnetwork/lnd/
    
    # fund your lnd wallet
    $ ./lncli-debug --network=testnet newaddress np2wk
    {
      "address": "2MzWbX7y124pVWUbZXqbBYfBww9WbLEbPfx"
    }

you need to deposit money into the address returned above (it will be different than the one in this README)


    # connect to our LN node
    $ ./lncli-debug --network=testnet connect 0338f57e4e20abf4d5c86b71b59e995ce4378e373b021a7b6f41dabb42d3aad069@ln.test.suredbits.com
    
    # open channel
    $ ./lncli-debug --network=testnet openchannel 0338f57e4e20abf4d5c86b71b59e995ce4378e373b021a7b6f41dabb42d3aad069 1000000

## Installing sb-api

 This uses [ln-service](https://github.com/alexbosworth/ln-service) as the bindings to lnd
 
 There is two important environment variables that need to be set to use this API

  1. `LND_CERT`
  2. `LND_MACAROON`
  
  Alex has information on how to get access to these, copying from his README
  
  Run base64 on the tls.cert and admin.macaroon files to get the encoded
authentication data to create the LND connection. You can find these files in
the LND directory. (`~/.lnd` or `~/Library/Application Support/Lnd`)

    $ base64 tls.cert
    $ base64 data/chain/bitcoin/mainnet/admin.macaroon
    
Copy those values and add them to your `~/.bashrc` file or `~/.bash_profile` on MacOS. Your file should look something like this
    
    #needed for gRPC
    export GRPC_SSL_CIPHER_SUITES='HIGH+ECDSA'
    
    #certificate, MAKE SURE NO EXTRA WHITE SPACE ADDED
    export LND_CERT=$(tr -d '[:space:]' <<< "PASTE YOUR CERT HERE")
     
    #macaroon, MAKE SURE NO EXTRA WHITE SPACE ADDED
    export LND_MACAROON=$(tr -d '[:space:]' <<< "PASTE YOUR MACAROON HERE")


## Run

You should be able to start the server with

    $ git clone git@github.com:SuredBits/sb-api-lnd.git
    $ cd sb-api-lnd
    $ npm install
    $ npm start
