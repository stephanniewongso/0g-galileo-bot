const { Web3 } = require('web3');
const fs = require('fs');
const colors = require('colors');
const { HttpProxyAgent } = require('http-proxy-agent');

const rpcUrl = 'https://evmrpc-testnet.0g.ai';
const chainId = 16601;

const web3 = new Web3(rpcUrl, {
  transactionConfirmationBlocks: 56,
  transactionBlockTimeout: 1000,
  defaultChainId: chainId
});

const mintABI = [
  {
    'inputs': [],
    'name': 'mint',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  }
];

const FACTORY_ABI = [
  {
    inputs: [
      { internalType: "address", name: "tokenA", type: "address" },
      { internalType: "address", name: "tokenB", type: "address" },
      { internalType: "uint24", name: "fee", type: "uint24" },
    ],
    name: "getPool",
    outputs: [{ internalType: "address", name: "pool", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];

const POOL_ABI = [
  {
    inputs: [],
    name: "slot0",
    outputs: [
      { internalType: "uint160", name: "sqrtPriceX96", type: "uint160" },
      { internalType: "int24", name: "tick", type: "int24" },
      { internalType: "uint16", name: "observationIndex", type: "uint16" },
      { internalType: "uint16", name: "observationCardinality", type: "uint16" },
      { internalType: "uint16", name: "observationCardinalityNext", type: "uint16" },
      { internalType: "uint8", name: "feeProtocol", type: "uint8" },
      { internalType: "bool", name: "unlocked", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "liquidity",
    outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function",
  },
];

const ERC20_ABI = [
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'spender', 'type': 'address' },
      { 'internalType': 'uint256', 'name': 'amount', 'type': 'uint256' }
    ],
    'name': 'approve',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'address', 'name': '', 'type': 'address' }],
    'name': 'balanceOf',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  }
];

const ROUTER_ABI = [
  {
    'inputs': [
      {
        'components': [
          { 'internalType': 'address', 'name': 'tokenIn', 'type': 'address' },
          { 'internalType': 'address', 'name': 'tokenOut', 'type': 'address' },
          { 'internalType': 'uint24', 'name': 'fee', 'type': 'uint24' },
          { 'internalType': 'address', 'name': 'recipient', 'type': 'address' },
          { 'internalType': 'uint256', 'name': 'deadline', 'type': 'uint256' },
          { 'internalType': 'uint256', 'name': 'amountIn', 'type': 'uint256' },
          { 'internalType': 'uint256', 'name': 'amountOutMinimum', 'type': 'uint256' },
          { 'internalType': 'uint160', 'name': 'sqrtPriceLimitX96', 'type': 'uint160' }
        ],
        'internalType': 'struct ISwapRouter.ExactInputSingleParams',
        'name': 'params',
        'type': 'tuple'
      }
    ],
    'name': 'exactInputSingle',
    'outputs': [{ 'internalType': 'uint256', 'name': 'amountOut', 'type': 'uint256' }],
    'stateMutability': 'payable',
    'type': 'function'
  }
];

const POSITION_MANAGER_ABI = [
  {
    inputs: [
      { internalType: "address", name: "token0", type: "address" },
      { internalType: "address", name: "token1", type: "address" },
      { internalType: "uint24", name: "fee", type: "uint24" },
      { internalType: "uint160", name: "sqrtPriceX96", type: "uint160" },
    ],
    name: "createAndInitializePoolIfNecessary",
    outputs: [{ internalType: "address", name: "pool", type: "address" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "token0", type: "address" },
          { internalType: "address", name: "token1", type: "address" },
          { internalType: "uint24", name: "fee", type: "uint24" },
          { internalType: "int24", name: "tickLower", type: "int24" },
          { internalType: "int24", name: "tickUpper", type: "int24" },
          { internalType: "uint256", name: "amount0Desired", type: "uint256" },
          { internalType: "uint256", name: "amount1Desired", type: "uint256" },
          { internalType: "uint256", name: "amount0Min", type: "uint256" },
          { internalType: "uint256", name: "amount1Min", type: "uint256" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
        ],
        internalType: "struct INonfungiblePositionManager.MintParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "mint",
    outputs: [
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "uint128", name: "liquidity", type: "uint128" },
      { internalType: "uint256", name: "amount0", type: "uint256" },
      { internalType: "uint256", name: "amount1", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
];

const contracts = {
  Ethereum: {
    address: '0x0fe9b43625fa7edd663adcec0728dd635e4abf7c',
    symbol: 'ETH'
  },
  Bitcoin: {
    address: '0x36f6414ff1df609214ddaba71c84f18bcf00f67d',
    symbol: 'BTC'
  },
  Tether: {
    address: '0x3ec8a8705be1d5ca90066b37ba62c4183b024ebf',
    symbol: 'USDT'
  }
};

const FACTORY_ADDRESS = "0x7453582657F056ce5CfcEeE9E31E4BC390fa2b3c";
const SWAP_ROUTER_ADDRESS = '0xb95b5953ff8ee5d5d9818cdbefe363ff2191318c';
const POSITION_MANAGER_ADDRESS = '0x44f24b66b3baa3a784dbeee9bfe602f15a2cc5d9';

function getTokenName(tokenAddress) {
  for (const [name, token] of Object.entries(contracts)) {
    if (token.address.toLowerCase() === tokenAddress.toLowerCase()) {
      return token.symbol;
    }
  }
  return tokenAddress.substring(0, 6) + '...' + tokenAddress.substring(38);
}

function log(msg, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  switch (type) {
    case 'success':
      console.log(`[${timestamp}] [✓] ${msg}`.green);
      break;
    case 'custom':
      console.log(`[${timestamp}] [*] ${msg}`.magenta);
      break;
    case 'error':
      console.log(`[${timestamp}] [✗] ${msg}`.red);
      break;
    case 'warning':
      console.log(`[${timestamp}] [!] ${msg}`.yellow);
      break;
    default:
      console.log(`[${timestamp}] [ℹ] ${msg}`.blue);
  }
}

function readProxies() {
  try {
    const data = fs.readFileSync('proxies.txt', 'utf8');
    return data.replace(/\r\n/g, '\n').split('\n').filter(p => p.trim() !== '');
  } catch (err) {
    log(`Error reading proxies.txt: ${err.message}`, 'error');
    return [];
  }
}

function readPrivateKeys() {
  try {
    const data = fs.readFileSync('privatekey.txt', 'utf8');
    const keys = data.replace(/\r\n/g, '\n').split('\n').filter(key => key.trim() !== '');
    return keys;
  } catch (err) {
    log(`Error reading privatekey.txt: ${err.message}`, 'error');
    return [];
  }
}

async function approveToken(tokenAddress, amount, account, privateKey, spender, web3) {
  const maxRetries = 3;
  const receiptCheckRetries = 20;
  const receiptCheckDelay = 20000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);
      const nonce = Number(await web3.eth.getTransactionCount(account.address, 'pending'));
      const gasPrice = Number(await web3.eth.getGasPrice()) * 1.5;

      const tx = {
        from: account.address,
        to: tokenAddress,
        gas: 100000,
        gasPrice: Math.floor(gasPrice),
        data: tokenContract.methods.approve(spender, amount).encodeABI(),
        nonce: nonce,
      };

      const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
      
      let txHash;
      try {
        const txPromise = web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        txHash = await new Promise((resolve) => {
          txPromise.on('transactionHash', resolve);
        });
        log(`Approve transaction sent: ${txHash}`, "info");
        
        const receipt = await txPromise;
        log(`Approved ${web3.utils.fromWei(amount.toString(), 'ether')} ${getTokenName(tokenAddress)} for ${spender}. Tx Hash: ${receipt.transactionHash}`, 'success');
        return;
      } catch (error) {
        if (error.message.includes('was not mined within') && txHash) {
          log(`Approve transaction timeout but has Tx Hash: ${txHash}. Check status...`, 'warning');
          
          for (let i = 0; i < receiptCheckRetries; i++) {
            try {
              const receipt = await web3.eth.getTransactionReceipt(txHash);
              if (receipt) {
                if (receipt.status) {
                  log(`Approve transaction successfully confirmed!`, 'success');
                  log(`Approved ${web3.utils.fromWei(amount.toString(), 'ether')} ${getTokenName(tokenAddress)} for ${spender}. Tx Hash: ${receipt.transactionHash}`, 'success');
                  return;
                } else {
                  log(`Approve transaction was mined but failed (status: false).`, 'error');
                  break;
                }
              } else {
                log(`Approve transaction is still pending... Check times ${i + 1}/${receiptCheckRetries}`, 'warning');
                await new Promise(resolve => setTimeout(resolve, receiptCheckDelay));
              }
            } catch (receiptError) {
              log(`Receipt check error approve ${txHash}: ${receiptError.message}`, 'error');
            }
          }
          
          try {
            const receipt = await web3.eth.getTransactionReceipt(txHash);
            if (receipt && receipt.status) {
              log(`Approve transaction successfully confirmed!`, 'success');
              log(`Approved ${web3.utils.fromWei(amount.toString(), 'ether')} ${getTokenName(tokenAddress)} for ${spender}. Tx Hash: ${receipt.transactionHash}`, 'success');
              return;
            }
          } catch (finalCheckError) {

          }
        } else {
          const errorMsg = error.message.toLowerCase();
          if (
            errorMsg.includes("invalid json response") ||
            errorMsg.includes("unexpected token") ||
            errorMsg.includes("failed to fetch") ||
            errorMsg.includes("network error") ||
            errorMsg.includes("timeout")
          ) {
            log(`RPC error when approve (${attempt}/${maxRetries}): ${error.message}. Retry...`, 'warning');
          } else {
            throw error; 
          }
        }
      }
    } catch (error) {
      if (attempt < maxRetries) {
        log(`Error approval time ${attempt}/${maxRetries}: ${error.message}. Retry...`, 'warning');
        await new Promise(resolve => setTimeout(resolve, 20000));
      } else {
        log(`Maximum number of retries reached (${maxRetries}) for approve: ${error.message}`, 'error');
        throw error;
      }
    }
  }
}

async function getExistingPools(tokenA, tokenB, web3) {
  try {
    const factoryContract = new web3.eth.Contract(FACTORY_ABI, FACTORY_ADDRESS);
    
    const token0 = tokenA < tokenB ? tokenA : tokenB;
    const token1 = tokenA < tokenB ? tokenB : tokenA;
    
    const feeTiers = [500, 3000, 20000];
    const existingPools = [];
    
    for (const fee of feeTiers) {
      const poolAddress = await factoryContract.methods.getPool(token0, token1, fee).call();
      
      if (poolAddress !== "0x0000000000000000000000000000000000000000") {
        const poolContract = new web3.eth.Contract(POOL_ABI, poolAddress);
        
        try {
          const liquidity = await poolContract.methods.liquidity().call();
          const slot0 = await poolContract.methods.slot0().call();
          
          if (BigInt(liquidity) > BigInt(0) && BigInt(slot0.sqrtPriceX96) > BigInt(0)) {
            existingPools.push({
              address: poolAddress,
              fee: fee,
              liquidity: liquidity
            });
          }
        } catch (error) {
          log(`Error checking pool ${poolAddress} with fee ${fee}: ${error.message}`, 'error');
        }
      }
    }
    
    return existingPools;
  } catch (error) {
    log(`Error getting existing pools for ${getTokenName(tokenA)}/${getTokenName(tokenB)}: ${error.message}`, 'error');
    return [];
  }
}

async function swapTokens(tokenIn, tokenOut, amountIn, account, privateKey, web3) {
  const routerContract = new web3.eth.Contract(ROUTER_ABI, SWAP_ROUTER_ADDRESS);
  const maxRetries = 30;
  const retryDelay = 20000;
  const receiptCheckRetries = 10;
  const receiptCheckDelay = 20000;

  const pools = await getExistingPools(tokenIn, tokenOut, web3);
  if (pools.length === 0) {
    log(`No pool found for pair ${getTokenName(tokenIn)}/${getTokenName(tokenOut)}`, "warning");
    throw new Error(`No active pools found for ${getTokenName(tokenIn)}/${getTokenName(tokenOut)}`);
  }

  pools.sort((a, b) => (BigInt(b.liquidity) > BigInt(a.liquidity)) ? 1 : -1);

  const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenIn);
  const tokenBalance = await tokenContract.methods.balanceOf(account.address).call();
  const amountInStr = amountIn.toString();

  if (BigInt(tokenBalance) < BigInt(amountInStr)) {
    log(`Insufficient balance: ${web3.utils.fromWei(tokenBalance, "ether")} < ${web3.utils.fromWei(amountInStr, "ether")}`, "error");
    throw new Error(`Insufficient ${getTokenName(tokenIn)} balance for swap`);
  }

  let swapSuccessful = false;

  for (const pool of pools) {
    let attempt = 0;

    while (attempt < maxRetries && !swapSuccessful) {
      attempt++;
      log(`Attempting to swap... with pool ${pool.address} (fee: ${pool.fee}) - Try time ${attempt}/${maxRetries}`, "info");

      try {
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 600).toString();
        const nonce = await web3.eth.getTransactionCount(account.address, "pending");
        const gasPrice = BigInt(Math.floor(Number(await web3.eth.getGasPrice()) * 1.5)).toString();

        const params = {
          tokenIn: tokenIn,
          tokenOut: tokenOut,
          fee: pool.fee,
          recipient: account.address,
          deadline: deadline,
          amountIn: amountInStr,
          amountOutMinimum: '0',
          sqrtPriceLimitX96: '0'
        };

        let estimatedGas;
        try {
          estimatedGas = await routerContract.methods
            .exactInputSingle(params)
            .estimateGas({ from: account.address });
        } catch (gasError) {
          throw new Error(`Gas estimation failed: ${gasError.message}`);
        }

        const gasBigInt = BigInt(Math.floor(Number(estimatedGas) * 1.2)).toString();

        const tx = {
          from: account.address,
          to: SWAP_ROUTER_ADDRESS,
          gas: gasBigInt,
          gasPrice: gasPrice,
          data: routerContract.methods.exactInputSingle(params).encodeABI(),
          nonce: nonce.toString(),
        };

        log(`Transaction details: ${JSON.stringify({
          from: tx.from,
          to: tx.to,
          gas: tx.gas.toString(),
          gasPrice: tx.gasPrice.toString(),
          nonce: tx.nonce.toString()
        })}`, "info");

        const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

        let receipt;
        let txHash;
        try {
          const txPromise = web3.eth.sendSignedTransaction(signedTx.rawTransaction);
          txHash = await new Promise((resolve) => {
            txPromise.on('transactionHash', resolve);
          });
          log(`Transaction sent: ${txHash}`, "info");
          receipt = await txPromise;
        } catch (error) {
          const errorMsg = error.message.toLowerCase();
          if (errorMsg.includes('was not mined within') && txHash) {
            log(`Timed out but got Tx Hash: ${txHash}. Check status...`, "warning");
            for (let i = 0; i < receiptCheckRetries; i++) {
              try {
                receipt = await web3.eth.getTransactionReceipt(txHash);
                if (receipt && receipt.status) {
                  log(`Transaction successfully mined after timeout.`, "success");
                  swapSuccessful = true;
                  break;
                } else if (receipt && !receipt.status) {
                  log(`Transaction mined but failed.`, "error");
                  break;
                } else {
                  log(`Transaction ${txHash} is still pending. Retry ${i + 1}/${receiptCheckRetries}`, "warning");
                  await new Promise(resolve => setTimeout(resolve, receiptCheckDelay));
                }
              } catch (receiptError) {
                throw new Error(`Receipt check failed: ${receiptError.message}`);
              }
            }
          } else {
            throw error;
          }
        }

        if (receipt && receipt.status) {
          log(
            `Swap to ${getTokenName(tokenOut)} with fees ${pool.fee}. Tx Hash: ${receipt.transactionHash}`,
            "success"
          );
          swapSuccessful = true;
        }
      } catch (error) {
        const errorMsg = error.message.toLowerCase();
        if (
          errorMsg.includes("invalid json response") ||
          errorMsg.includes("unexpected token") ||
          errorMsg.includes("failed to fetch") ||
          errorMsg.includes("network error")
        ) {
          if (attempt < maxRetries) {
            log(`Retrying after ${retryDelay / 20000} seconds due to error: ${error.message}`, "warning");
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          } else {
            log(`Maximum number of retries reached (${maxRetries}) for pool ${pool.address}: ${error.message}`, "error");
            break;
          }
        } else {
          log(`Error cannot retry: ${error.message}`, "error");
          if (error.stack) {
            log(`Error stack: ${error.stack}`, "error");
          }
          break;
        }
      }
    }

    if (swapSuccessful) {
      break;
    }
  }

  if (!swapSuccessful) {
    throw new Error(`Cannot swap ${getTokenName(tokenIn)} to ${getTokenName(tokenOut)}`);
  }
}

async function mintFromContract(privateKey, contractInfo, contractTag, web3) {
  let account;
  
  try {
    account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    
    const balance = await web3.eth.getBalance(account.address);
    log(`Wallet balance ${account.address}: ${web3.utils.fromWei(balance, 'ether')} 0G`);
    
    if (Number(balance) <= 0) {
      log(`Insufficient balance to mint ${contractInfo.symbol}`, 'warning');
      return;
    }

    const tokenContract = new web3.eth.Contract(ERC20_ABI, contractInfo.address);
    const tokenBalance = await tokenContract.methods.balanceOf(account.address).call();
    log(`Balance ${contractInfo.symbol}: ${web3.utils.fromWei(tokenBalance, 'ether')}`);

    const thresholds = {
      'USDT': web3.utils.toWei('1000000', 'ether'),
      'ETH': web3.utils.toWei('1000', 'ether'),
      'BTC': web3.utils.toWei('100', 'ether')
    };

    const threshold = thresholds[contractInfo.symbol];
    if (BigInt(tokenBalance) >= BigInt(threshold)) {
      log(`Balance ${contractInfo.symbol} (${web3.utils.fromWei(tokenBalance, 'ether')}) bigger (${web3.utils.fromWei(threshold, 'ether')}), no mint`, 'warning');
      return;
    }

    const contract = new web3.eth.Contract(mintABI, contractInfo.address);
    
    log(`Start minting ${contractInfo.symbol} token...`, 'custom');
    const nonce = Number(await web3.eth.getTransactionCount(account.address, 'pending'));
    const gasPrice = Number(await web3.eth.getGasPrice()) * 1.5;

    const mintTx = {
      from: account.address,
      to: contractInfo.address,
      gas: 500000,
      gasPrice: Math.floor(gasPrice),
      data: contract.methods.mint().encodeABI(),
      nonce: nonce,
    };
    
    const signedMintTx = await web3.eth.accounts.signTransaction(mintTx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedMintTx.rawTransaction);
   log(`${contractInfo.symbol} Mint successful for wallet ${account.address}. Tx Hash: ${receipt.transactionHash}`, 'success');

  } catch (error) {
    log(`Mint token failed for wallet ${account?.address || 'unknown address'}: ${error.message}`, 'error');
  } finally {
    web3.eth.accounts.wallet.clear();
  }
}

function roundToDecimal(amount, decimals = 18) {
  const amountStr = amount.toString();
  const etherValueStr = web3.utils.fromWei(amountStr, "ether");
  const rounded = Number(etherValueStr).toFixed(3);
  return web3.utils.toWei(rounded, "ether");
}

async function addLiquidityEthBtc(account, privateKey, web3) {
  const maxRetries = 30;
  const retryDelay = 20000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const positionManagerContract = new web3.eth.Contract(POSITION_MANAGER_ABI, POSITION_MANAGER_ADDRESS);
      const ethContract = new web3.eth.Contract(ERC20_ABI, contracts.Ethereum.address);
      const btcContract = new web3.eth.Contract(ERC20_ABI, contracts.Bitcoin.address);

      const ethBalance = await ethContract.methods.balanceOf(account.address).call();
      const btcBalance = await btcContract.methods.balanceOf(account.address).call();
      log(`Balance ${getTokenName(contracts.Ethereum.address)}: ${web3.utils.fromWei(ethBalance, 'ether')}`, 'info');
      log(`Balance ${getTokenName(contracts.Bitcoin.address)}: ${web3.utils.fromWei(btcBalance, 'ether')}`, 'info');

      const ethAmount = BigInt(ethBalance) * BigInt(3) / BigInt(100);
      const btcAmount = BigInt(btcBalance) * BigInt(3) / BigInt(100);

      if (ethAmount <= BigInt(0) || btcAmount <= BigInt(0)) {
        log(`Insufficient balance to add liquidity`, 'warning');
        return true; 
      }

      log(`Approve ${web3.utils.fromWei(ethAmount, 'ether')} ${getTokenName(contracts.Ethereum.address)} for Position Manager...`, 'info');
      await approveToken(contracts.Ethereum.address, ethAmount, account, privateKey, POSITION_MANAGER_ADDRESS, web3);
      log(`Approve ${web3.utils.fromWei(btcAmount, 'ether')} ${getTokenName(contracts.Bitcoin.address)} for Position Manager...`, 'info');
      await approveToken(contracts.Bitcoin.address, btcAmount, account, privateKey, POSITION_MANAGER_ADDRESS, web3);

      const token0 = contracts.Ethereum.address < contracts.Bitcoin.address ? contracts.Ethereum.address : contracts.Bitcoin.address;
      const token1 = contracts.Ethereum.address < contracts.Bitcoin.address ? contracts.Bitcoin.address : contracts.Ethereum.address;
      const fee = 3000;
      const sqrtPriceX96 = BigInt('79228162514264337593543950336');

      log(`Check and create pool ${getTokenName(token0)}/${getTokenName(token1)} if needed... (Attempts ${attempt}/${maxRetries})`, 'info');
      const poolTx = {
        from: account.address,
        to: POSITION_MANAGER_ADDRESS,
        gas: 300000,
        gasPrice: Math.floor(Number(await web3.eth.getGasPrice()) * 1.5),
        data: positionManagerContract.methods
          .createAndInitializePoolIfNecessary(token0, token1, fee, sqrtPriceX96)
          .encodeABI(),
        nonce: Number(await web3.eth.getTransactionCount(account.address, 'pending')),
      };

      let poolReceipt;
      let txHash;
      try {
        const signedPoolTx = await web3.eth.accounts.signTransaction(poolTx, privateKey);
        const txPromise = web3.eth.sendSignedTransaction(signedPoolTx.rawTransaction);
        txHash = await new Promise((resolve) => {
          txPromise.on('transactionHash', resolve);
        });
        poolReceipt = await txPromise;
      } catch (error) {
        if (error.message.includes('was not mined within') && txHash) {
          log(`Transaction created pool timeout but has Tx Hash: ${txHash}. Check status...`, 'warning');
          for (let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 20000));
            try {
              poolReceipt = await web3.eth.getTransactionReceipt(txHash);
              if (poolReceipt && poolReceipt.status) {
                log(`Transaction ${txHash} was mined successfully!`, 'success');
                break;
              } else if (poolReceipt && !poolReceipt.status) {
                log(`Transaction ${txHash} failed (status: false).`, 'error');
                throw new Error("Transaction failed with status false");
              } else {
                log(`Transaction ${txHash} is still pending... Try again ${i + 1}/10`, 'warning');
              }
            } catch (receiptError) {
              log(`Error checking transaction receipt ${txHash}: ${receiptError.message}`, 'error');
              throw receiptError;
            }
          }
          if (!poolReceipt || !poolReceipt.status) {
            throw new Error(`Transaction ${txHash} not mined after multiple attempts`);
          }
        } else {
          throw error;
        }
      }
      log(`Pool ${getTokenName(token0)}/${getTokenName(token1)} is created or already exists. Tx Hash: ${poolReceipt.transactionHash}`, 'success');

      const tickLower = -887220;
      const tickUpper = 887220;
      const amount0Desired = token0 === contracts.Ethereum.address ? ethAmount : btcAmount;
      const amount1Desired = token0 === contracts.Ethereum.address ? btcAmount : ethAmount;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600).toString();

      const mintParams = {
        token0: token0,
        token1: token1,
        fee: fee,
        tickLower: tickLower,
        tickUpper: tickUpper,
        amount0Desired: amount0Desired.toString(),
        amount1Desired: amount1Desired.toString(),
        amount0Min: '0',
        amount1Min: '0',
        recipient: account.address,
        deadline: deadline,
      };

      log(`Adding liquidity... ${web3.utils.fromWei(ethAmount, 'ether')} ${getTokenName(contracts.Ethereum.address)} và ${web3.utils.fromWei(btcAmount, 'ether')} ${getTokenName(contracts.Bitcoin.address)}...`, 'info');
      const mintTx = {
        from: account.address,
        to: POSITION_MANAGER_ADDRESS,
        gas: 500000,
        gasPrice: Math.floor(Number(await web3.eth.getGasPrice()) * 1.5),
        data: positionManagerContract.methods.mint(mintParams).encodeABI(),
        nonce: Number(await web3.eth.getTransactionCount(account.address, 'pending')),
      };

      let mintReceipt;
      try {
        const signedMintTx = await web3.eth.accounts.signTransaction(mintTx, privateKey);
        const mintTxPromise = web3.eth.sendSignedTransaction(signedMintTx.rawTransaction);
        txHash = await new Promise((resolve) => {
          mintTxPromise.on('transactionHash', resolve);
        });
        mintReceipt = await mintTxPromise;
      } catch (error) {
        if (error.message.includes('was not mined within') && txHash) {
          log(`Liquidity add transaction timeout but got Tx Hash: ${txHash}. Check status...`, 'warning');
          for (let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 20000));
            try {
              mintReceipt = await web3.eth.getTransactionReceipt(txHash);
              if (mintReceipt && mintReceipt.status) {
                log(`Transaction ${txHash} was mined successfully!`, 'success');
                break;
              } else if (mintReceipt && !mintReceipt.status) {
                log(`Transaction ${txHash} failed (status: false).`, 'error');
                throw new Error("Transaction failed with status false");
              } else {
                log(`Transaction ${txHash} is still pending... Try again ${i + 1}/10`, 'warning');
              }
            } catch (receiptError) {
              log(`Error checking transaction receipt ${txHash}: ${receiptError.message}`, 'error');
              throw receiptError;
            }
          }
          if (!mintReceipt || !mintReceipt.status) {
            throw new Error(`Transaction ${txHash} not mined after multiple attempts`);
          }
        } else {
          throw error;
        }
      }
      log(`Liquidity added successfully ${getTokenName(token0)}/${getTokenName(token1)} success. Tx Hash: ${mintReceipt.transactionHash}`, 'success');
      return true;
      
    } catch (error) {
      const errorMsg = error.message.toLowerCase();
      if (
        errorMsg.includes("invalid json response") ||
        errorMsg.includes("unexpected token") ||
        errorMsg.includes("failed to fetch") ||
        errorMsg.includes("network error") ||
        errorMsg.includes("connection refused") ||
        errorMsg.includes("timeout")
      ) {
        if (attempt < maxRetries) {
          log(`RPC error (${attempt}/${maxRetries}): ${error.message}. Retry in ${retryDelay/20000} seconds...`, 'warning');
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        } else {
          log(`Maximum number of retries reached (${maxRetries}): ${error.message}`, 'error');
        }
      } else {
        log(`Error while adding liquidity ${getTokenName(contracts.Ethereum.address)}/${getTokenName(contracts.Bitcoin.address)}: ${error.message}`, 'error');
      }
      return true;
    }
  }
  return true;
}

async function addLiquidity(account, privateKey, tokenA, tokenB, web3) {
  const maxRetries = 30;
  const retryDelay = 20000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const positionManagerContract = new web3.eth.Contract(POSITION_MANAGER_ABI, POSITION_MANAGER_ADDRESS);
      const tokenAContract = new web3.eth.Contract(ERC20_ABI, tokenA);
      const tokenBContract = new web3.eth.Contract(ERC20_ABI, tokenB);

      const tokenABalance = await tokenAContract.methods.balanceOf(account.address).call();
      const tokenBBalance = await tokenBContract.methods.balanceOf(account.address).call();
      log(`Balance  ${getTokenName(tokenA)}: ${web3.utils.fromWei(tokenABalance, 'ether')}`, 'info');
      log(`Balance  ${getTokenName(tokenB)}: ${web3.utils.fromWei(tokenBBalance, 'ether')}`, 'info');

      const tokenAAmount = BigInt(tokenABalance) * BigInt(3) / BigInt(100);
      const tokenBAmount = BigInt(tokenBBalance) * BigInt(3) / BigInt(100);

      if (tokenAAmount <= BigInt(0) || tokenBAmount <= BigInt(0)) {
        log(`Insufficient balance to add liquidity`, 'warning');
        return false; 
      }

      log(`Approve ${web3.utils.fromWei(tokenAAmount.toString(), 'ether')} ${getTokenName(tokenA)} for Position Manager...`, 'info');
      await approveToken(tokenA, tokenAAmount, account, privateKey, POSITION_MANAGER_ADDRESS, web3);
      log(`Approve ${web3.utils.fromWei(tokenBAmount.toString(), 'ether')} ${getTokenName(tokenB)} for Position Manager...`, 'info');
      await approveToken(tokenB, tokenBAmount, account, privateKey, POSITION_MANAGER_ADDRESS, web3);

      const token0 = tokenA < tokenB ? tokenA : tokenB;
      const token1 = tokenA < tokenB ? tokenB : tokenA;
      const fee = 3000;
      const sqrtPriceX96 = BigInt('79228162514264337593543950336');

      log(`Check and create pool ${getTokenName(token0)}/${getTokenName(token1)} if needed... (Attempts ${attempt}/${maxRetries})`, 'info');
      const poolTx = {
        from: account.address,
        to: POSITION_MANAGER_ADDRESS,
        gas: 300000,
        gasPrice: Math.floor(Number(await web3.eth.getGasPrice()) * 1.5),
        data: positionManagerContract.methods
          .createAndInitializePoolIfNecessary(token0, token1, fee, sqrtPriceX96)
          .encodeABI(),
        nonce: Number(await web3.eth.getTransactionCount(account.address, 'pending')),
      };

      let poolReceipt;
      let txHash;
      try {
        const signedPoolTx = await web3.eth.accounts.signTransaction(poolTx, privateKey);
        const txPromise = web3.eth.sendSignedTransaction(signedPoolTx.rawTransaction);
        txHash = await new Promise((resolve) => {
          txPromise.on('transactionHash', resolve);
        });
        poolReceipt = await txPromise;
      } catch (error) {
        if (error.message.includes('was not mined within') && txHash) {
          log(`Transaction created pool timeout but has Tx Hash: ${txHash}. Check status...`, 'warning');
          for (let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 20000));
            try {
              poolReceipt = await web3.eth.getTransactionReceipt(txHash);
              if (poolReceipt && poolReceipt.status) {
                log(`Transaction ${txHash} was mined successfully!`, 'success');
                break;
              } else if (poolReceipt && !poolReceipt.status) {
                log(`Transaction ${txHash} failed (status: false).`, 'error');
                throw new Error("Transaction failed with status false");
              } else {
                log(`Transaction ${txHash} is still pending... Try again ${i + 1}/10`, 'warning');
              }
            } catch (receiptError) {
              log(`Error checking transaction receipt ${txHash}: ${receiptError.message}`, 'error');
              throw receiptError;
            }
          }
          if (!poolReceipt || !poolReceipt.status) {
            throw new Error(`Transaction ${txHash} not mined after multiple attempts`);
          }
        } else {
          throw error;
        }
      }
      log(`Pool ${getTokenName(token0)}/${getTokenName(token1)} is created or already exists. Tx Hash: ${poolReceipt.transactionHash}`, 'success');

      const tickLower = -887220;
      const tickUpper = 887220;
      const amount0Desired = token0 === tokenA ? tokenAAmount : tokenBAmount;
      const amount1Desired = token0 === tokenA ? tokenBAmount : tokenAAmount;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600).toString();

      const mintParams = {
        token0: token0,
        token1: token1,
        fee: fee,
        tickLower: tickLower,
        tickUpper: tickUpper,
        amount0Desired: amount0Desired.toString(),
        amount1Desired: amount1Desired.toString(),
        amount0Min: '0',
        amount1Min: '0',
        recipient: account.address,
        deadline: deadline,
      };

      log(`Adding liquidity... ${web3.utils.fromWei(tokenAAmount.toString(), 'ether')} ${getTokenName(tokenA)} và ${web3.utils.fromWei(tokenBAmount.toString(), 'ether')} ${getTokenName(tokenB)}...`, 'info');
      const mintTx = {
        from: account.address,
        to: POSITION_MANAGER_ADDRESS,
        gas: 500000,
        gasPrice: Math.floor(Number(await web3.eth.getGasPrice()) * 1.5),
        data: positionManagerContract.methods.mint(mintParams).encodeABI(),
        nonce: Number(await web3.eth.getTransactionCount(account.address, 'pending')),
      };

      let mintReceipt;
      try {
        const signedMintTx = await web3.eth.accounts.signTransaction(mintTx, privateKey);
        const mintTxPromise = web3.eth.sendSignedTransaction(signedMintTx.rawTransaction);
        txHash = await new Promise((resolve) => {
          mintTxPromise.on('transactionHash', resolve);
        });
        mintReceipt = await mintTxPromise;
      } catch (error) {
        if (error.message.includes('was not mined within') && txHash) {
          log(`Liquidity add transaction timeout but got Tx Hash: ${txHash}. Check status...`, 'warning');
          for (let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 20000));
            try {
              mintReceipt = await web3.eth.getTransactionReceipt(txHash);
              if (mintReceipt && mintReceipt.status) {
                log(`Transaction ${txHash} was mined successfully!`, 'success');
                break;
              } else if (mintReceipt && !mintReceipt.status) {
                log(`Transaction ${txHash} failed (status: false).`, 'error');
                throw new Error("Transaction failed with status false");
              } else {
                log(`Transaction ${txHash} is still pending... Try again ${i + 1}/10`, 'warning');
              }
            } catch (receiptError) {
              log(`Error checking transaction receipt ${txHash}: ${receiptError.message}`, 'error');
              throw receiptError;
            }
          }
          if (!mintReceipt || !mintReceipt.status) {
            throw new Error(`Transaction ${txHash} not mined after multiple attempts`);
          }
        } else {
          throw error;
        }
      }
      log(`Liquidity added successfully ${getTokenName(token0)}/${getTokenName(token1)} success. Tx Hash: ${mintReceipt.transactionHash}`, 'success');
      return true;
      
    } catch (error) {
      const errorMsg = error.message.toLowerCase();
      if (
        errorMsg.includes("invalid json response") ||
        errorMsg.includes("unexpected token") ||
        errorMsg.includes("failed to fetch") ||
        errorMsg.includes("network error") ||
        errorMsg.includes("connection refused") ||
        errorMsg.includes("timeout")
      ) {
        if (attempt < maxRetries) {
         log(`RPC error (${attempt}/${maxRetries}): ${error.message}. Retry in ${retryDelay/20000} seconds...`, 'warning');
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        } else {
          log(`Maximum number of retries reached (${maxRetries}): ${error.message}`, 'error');
        }
      } else {
        log(`Error while adding liquidity ${getTokenName(tokenA)}/${getTokenName(tokenB)}: ${error.message}`, 'error');
      }
      return false;
    }
  }
  return false;
}

async function addLiquidityAllPairs(account, privateKey, web3) {
  log(`Start adding liquidity for all token pairs...`, 'custom');
  
  await addLiquidity(account, privateKey, contracts.Ethereum.address, contracts.Bitcoin.address, web3);
  
  await addLiquidity(account, privateKey, contracts.Ethereum.address, contracts.Tether.address, web3);
  
  await addLiquidity(account, privateKey, contracts.Bitcoin.address, contracts.Tether.address, web3);
  
  log(`Finished adding liquidity for all token pairs`, 'success');
}

async function checkAndSwapTokens(privateKey, web3) {
  let account;

  try {
    account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);

    log(`Check balance and prepare swap for wallet ${account.address}`, "custom");

    const usdtContract = new web3.eth.Contract(ERC20_ABI, contracts.Tether.address);
    const btcContract = new web3.eth.Contract(ERC20_ABI, contracts.Bitcoin.address);
    const ethContract = new web3.eth.Contract(ERC20_ABI, contracts.Ethereum.address);

    let usdtBalance = await usdtContract.methods.balanceOf(account.address).call();
    let btcBalance = await btcContract.methods.balanceOf(account.address).call();
    let ethBalance = await ethContract.methods.balanceOf(account.address).call();

    log(`${contracts.Tether.symbol} Balance: ${web3.utils.fromWei(usdtBalance, "ether")}`, 'info');
    log(`${contracts.Bitcoin.symbol} Balance: ${web3.utils.fromWei(btcBalance, "ether")}`, 'info');
    log(`${contracts.Ethereum.symbol} Balance: ${web3.utils.fromWei(ethBalance, "ether")}`, 'info');

    const usdtThreshold = web3.utils.toWei("1000", "ether");
    const ethThreshold = web3.utils.toWei("1", "ether");
    const btcThreshold = web3.utils.toWei("0.03", "ether");

    if (BigInt(usdtBalance) < BigInt(usdtThreshold)) {
      log(`USDT balance low, minting...`, 'info');
      await mintFromContract(privateKey, contracts.Tether, 'Tether', web3);
      usdtBalance = await usdtContract.methods.balanceOf(account.address).call();
      log(`USDT balance after minting: ${web3.utils.fromWei(usdtBalance, "ether")}`, 'info');
    }

    if (BigInt(ethBalance) < BigInt(ethThreshold)) {
      log(`Low ETH balance, minting...`, 'info');
      await mintFromContract(privateKey, contracts.Ethereum, 'Ethereum', web3);
      ethBalance = await ethContract.methods.balanceOf(account.address).call(); 
      log(`ETH balance after minting: ${web3.utils.fromWei(ethBalance, "ether")}`, 'info');
    }

    if (BigInt(btcBalance) < BigInt(btcThreshold)) {
      log(`Low BTC balance, minting...`, 'info');
      await mintFromContract(privateKey, contracts.Bitcoin, 'Bitcoin', web3);
      btcBalance = await btcContract.methods.balanceOf(account.address).call();
      log(`BTC balance after minting: ${web3.utils.fromWei(btcBalance, "ether")}`, 'info');
    }

    if (
      BigInt(usdtBalance) < BigInt(usdtThreshold) ||
      BigInt(ethBalance) < BigInt(ethThreshold) ||
      BigInt(btcBalance) < BigInt(btcThreshold)
    ) {
      log(`Insufficient balance after minting: USDT=${web3.utils.fromWei(usdtBalance, "ether")}, ETH=${web3.utils.fromWei(ethBalance, "ether")}, BTC=${web3.utils.fromWei(btcBalance, "ether")}`, 'error');
      return;
    }


    await addLiquidityAllPairs(account, privateKey, web3);
    const minSwapAmount = web3.utils.toWei("0.005", "ether");
    const swapOperations = [];

    if (BigInt(usdtBalance) > 0) {
      const randomPct1 = 0.05 + Math.random() * 0.05;
      const randomPct2 = 0.05 + Math.random() * 0.05;
      const usdtBalanceNum = Number(web3.utils.fromWei(usdtBalance, "ether"));
      let usdtToBtcAmount = usdtBalanceNum * randomPct1;
      let usdtToEthAmount = usdtBalanceNum * randomPct2;
      let usdtToBtc = web3.utils.toWei(usdtToBtcAmount.toFixed(3), "ether");
      let usdtToEth = web3.utils.toWei(usdtToEthAmount.toFixed(3), "ether");

      if (BigInt(usdtToBtc) > BigInt(minSwapAmount)) {
        swapOperations.push({
          tokenIn: contracts.Tether.address,
          tokenOut: contracts.Bitcoin.address,
          amount: usdtToBtc,
          description: `Swap to ${contracts.Bitcoin.symbol}`
        });
      } else {
        log(`${contracts.Tether.symbol} → ${contracts.Bitcoin.symbol} amount too small: ${web3.utils.fromWei(usdtToBtc, "ether")}`, "warning");
      }

      if (BigInt(usdtToEth) > BigInt(minSwapAmount)) {
        swapOperations.push({
          tokenIn: contracts.Tether.address,
          tokenOut: contracts.Ethereum.address,
          amount: usdtToEth,
          description: `Swap to ${contracts.Ethereum.symbol}`
        });
      } else {
        log(`${contracts.Tether.symbol} → ${contracts.Ethereum.symbol} amount too small: ${web3.utils.fromWei(usdtToEth, "ether")}`, "warning");
      }
    }

    if (BigInt(btcBalance) > 0) {
      const btcBalanceNum = Number(web3.utils.fromWei(btcBalance, "ether"));
      const randomPct = 0.05 + Math.random() * 0.05;
      let btcToUsdtAmount = btcBalanceNum * randomPct;
      let btcToUsdt = web3.utils.toWei(btcToUsdtAmount.toFixed(3), "ether");

      if (BigInt(btcToUsdt) > BigInt(minSwapAmount)) {
        swapOperations.push({
          tokenIn: contracts.Bitcoin.address,
          tokenOut: contracts.Tether.address,
          amount: btcToUsdt,
          description: `Swap to ${contracts.Tether.symbol}`
        });
      } else {
        log(`${contracts.Bitcoin.symbol} → ${contracts.Tether.symbol} amount too small: ${web3.utils.fromWei(btcToUsdt, "ether")}`, "warning");
      }
    }

    if (BigInt(ethBalance) > 0) {
      const ethBalanceNum = Number(web3.utils.fromWei(ethBalance, "ether"));
      const randomPct = 0.05 + Math.random() * 0.05;
      let ethToUsdtAmount = ethBalanceNum * randomPct;
      let ethToUsdt = web3.utils.toWei(ethToUsdtAmount.toFixed(3), "ether");

      if (BigInt(ethToUsdt) > BigInt(minSwapAmount)) {
        swapOperations.push({
          tokenIn: contracts.Ethereum.address,
          tokenOut: contracts.Tether.address,
          amount: ethToUsdt,
          description: `Swap to ${contracts.Tether.symbol}`
        });
      } else {
        log(`${contracts.Ethereum.symbol} → ${contracts.Tether.symbol} amount too small: ${web3.utils.fromWei(ethToUsdt, "ether")}`, "warning");
      }
    }

    for (const op of swapOperations) {
      try {
        log(`${op.description}...`, "custom");
        await approveToken(op.tokenIn, op.amount, account, privateKey, SWAP_ROUTER_ADDRESS, web3);
        await swapTokens(op.tokenIn, op.tokenOut, op.amount, account, privateKey, web3);
      } catch (error) {
        log(`Unable to execute ${op.description}: ${error.message}`, "error");
      }
    }

  } catch (error) {
    log(`Error in checkAndSwapTokens for ${account?.address || "unknown address"}: ${error.message}`, "error");
  } finally {
    web3.eth.accounts.wallet.clear();
  }
}

async function mainLoop() {
  const privateKeys = readPrivateKeys();
  const proxies = readProxies();

  if (privateKeys.length === 0) {
    log('Privatekey not found in privatekey.txt', 'error');
    return;
  }

  if (proxies.length > privateKeys.length) {
    log(`⚠️ More proxies (${proxies.length}) than private keys (${privateKeys.length}). Extra proxies will be ignored.`, 'warning');
  } else if (proxies.length < privateKeys.length) {
    log(`⚠️ Fewer proxies (${proxies.length}) than private keys (${privateKeys.length}). Some wallets will reuse the last proxy.`, 'warning');
  }

  
  log(`Wallets found`);
  log('====== Dân cày airdrop - If you’re afraid, don’t use it; if you use it, don’t be afraid ======', 'custom');

  const cycles = 10;

  while (true) {
    const runStart = new Date();
    log(`Starting at ${runStart.toLocaleString()}`, 'custom');

    for (let i = 0; i < privateKeys.length; i++) {
      const privateKey = privateKeys[i];
      const proxy = proxies[i] || proxies[proxies.length - 1];

      const { HttpProxyAgent } = require('http-proxy-agent');
	  const agent = new HttpProxyAgent(proxy);
      const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl, { agent }));

      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
	  log(`Using proxy: ${proxy}`, 'info');
      log(`Minting tokens for wallet ${account.address}`, 'custom');

      for (const [tag, tokenInfo] of Object.entries(contracts)) {
        await mintFromContract(privateKey, tokenInfo, tag, web3);
        await new Promise(resolve => setTimeout(resolve, 20000));
      }

      for (let cycle = 1; cycle <= cycles; cycle++) {
        log(`Cycle ${cycle}/${cycles} - Swapping for wallet ${account.address}`, 'custom');
        await checkAndSwapTokens(privateKey, web3);
        await new Promise(resolve => setTimeout(resolve, 20000));
      }
    }

    log(`✅ All wallets processed. Waiting 24 hours to restart...`, 'custom');
    await new Promise(resolve => setTimeout(resolve, 24 * 60 * 60 * 1000));
  }
}

mainLoop().catch(error => log(`Error occurred: ${error.message}`, 'error'));
