import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PredictionMarket } from "../target/types/prediction_market";
import { BN } from "@coral-xyz/anchor";
import { expect } from "chai";
import { SplTokenMinter } from "../target/types/spl_token_minter";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { amount, Metaplex } from "@metaplex-foundation/js";
import { assert } from "chai";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
  getAccount
} from "@solana/spl-token";
import { WalletConfigError } from "@solana/wallet-adapter-base";

describe("prediction-market and token usage", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const dataAccount = anchor.web3.Keypair.generate();
  const splDataAccount = anchor.web3.Keypair.generate();
  const mintKeypair = anchor.web3.Keypair.generate();
  
  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;
  
  const program = anchor.workspace.PredictionMarket as Program<PredictionMarket>;
  const splProgram = anchor.workspace.SplTokenMinter as Program<SplTokenMinter>;
  
  const tokenTitle = "BullsUSDC";
  const tokenSymbol = "USDC";
  const tokenUri =
  "https://res.cloudinary.com/ddwkxn8ak/image/upload/v1698823073/solangsol/Course1_mhz1c1.png";
  
  let contractTokenAccount;
  let tokenAccount;
  let recepienttokenAmount;
  
  async function getRecipientTokenAmount() {
    // Assuming getAccount and receipientTokenAccount are defined elsewhere
    const recipientTokenAccount = await getAccount(connection, recepienttokenAmount.address);
    const amount = recipientTokenAccount.amount;
    return amount;
  }

  it("SPL Is initialized!", async () => {
    // Add your test here.
    const tx = await splProgram.methods
      .new()
      .accounts({ dataAccount: splDataAccount.publicKey })
      .signers([splDataAccount])
      .rpc();
    console.log("Your transaction signature", tx);
  });

  it("Create an SPL Token!", async () => {
    const metaplex = Metaplex.make(connection);
    const metadataAddress = await metaplex
      .nfts()
      .pdas()
      .metadata({ mint: mintKeypair.publicKey });

    // Add your test here.
    const tx = await splProgram.methods
      .createTokenMint(
        wallet.publicKey, // freeze authority
        9, // 0 decimals for NFT
        tokenTitle, // NFT name
        tokenSymbol, // NFT symbol
        tokenUri // NFT URI
      )
      .accounts({
        payer: wallet.publicKey,
        mint: mintKeypair.publicKey,
        metadata: metadataAddress,
        mintAuthority: wallet.publicKey,
        rentAddress: SYSVAR_RENT_PUBKEY,
        metadataProgramId: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
      })
      .signers([mintKeypair])
      .rpc({ skipPreflight: true });
    console.log("Your transaction signature", tx);
  });

  it("Mint some tokens to your wallet!", async () => {
    // Wallet's associated token account address for mint
    console.log("wallet",wallet)
    tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer, // payer
      mintKeypair.publicKey, // mint
      wallet.publicKey // owner
    );

    console.log("associated token account:", tokenAccount)

    const tx = await splProgram.methods
      .mintTo(
        new anchor.BN(150) // amount to mint
      )
      .accounts({
        mintAuthority: wallet.publicKey,
        tokenAccount: tokenAccount.address,
        mint: mintKeypair.publicKey,
      })
      .rpc({ skipPreflight: true });
    console.log("Your transaction signature", tx);

    // console.log("Your transaction signature", tx);
     recepienttokenAmount = (await getAccount(connection, tokenAccount.address)).amount;
    console.log("recipienttokenAmount", recepienttokenAmount);
    let tokens = Number(recepienttokenAmount);
    console.log("tkens", tokens)
  });

  it("Transfer some tokens to another wallet!", async () => {

    const receipient = anchor.web3.Keypair.generate();
    const receipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer, // payer
      mintKeypair.publicKey, // mint account
      receipient.publicKey // owner account
    );

    const tx = await splProgram.methods
      .transferTokens(
        new anchor.BN(50)
      )
      .accounts({
        from: tokenAccount.address,
        to: receipientTokenAccount.address,
        owner: wallet.publicKey,
      })
      .rpc();
    console.log("Your transaction signature", tx);
    const recepienttokenAmount = (await getAccount(connection, receipientTokenAccount.address)).amount;
    console.log("recipienttokenAmount", recepienttokenAmount);
    let tokens = Number(recepienttokenAmount);
    console.log("reciepenmt token:", tokens);


    const bachehuetoken = (await getAccount(connection, tokenAccount.address)).amount;
    console.log("bachehuetoken", bachehuetoken);
    let tokensss = Number(bachehuetoken);
    console.log("tokens", tokensss)
  });


  
  it("Creates a token account from contract's program ID and transfers tokens", async () => {
    // 1. Create associated token account for the contract's program ID
    contractTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer, // payer
      mintKeypair.publicKey, // mint key
      program.programId // owner
    );

    console.log("Contract Token Account:", contractTokenAccount.address);

    // 2. Create a sender's associated token account (simulating the sender's account)
    const sender = anchor.web3.Keypair.generate();
    const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer, // payer
      mintKeypair.publicKey, // mint key
      sender.publicKey // owner (this could be another wallet in a real case)
    );

    console.log("Sender Token Account:", senderTokenAccount.address);

    // 3. Mint some tokens to the sender's account
    const txMint = await splProgram.methods
      .mintTo(new anchor.BN(200)) // Mint 200 tokens
      .accounts({
        mintAuthority: wallet.publicKey,
        tokenAccount: senderTokenAccount.address,
        mint: mintKeypair.publicKey,
      })
      .rpc({ skipPreflight: true });

    console.log("Mint transaction signature:", txMint);

    // 5. Transfer tokens from the sender's token account to the recipient's token account
    const amountToTransfer = new anchor.BN(50)
    const txTransfer = await splProgram.methods
      .transferTokens(amountToTransfer) // Amount to transfer
      .accounts({
        from: senderTokenAccount.address,
        to: contractTokenAccount.address,
        owner: sender.publicKey,
      })
      .signers([sender])
      .rpc();

    console.log("Token transfer transaction signature:", txTransfer);

    // 6. Check recipient's token amount after transfer
    const contractTokenAccountData = await getAccount(connection, contractTokenAccount.address);
    const recipientAmount = contractTokenAccountData.amount;
    console.log("Recipient token amount after transfer:", recipientAmount.toString());

    // 7. Validate the transfer
    assert.equal(
      recipientAmount.toString(),
      amountToTransfer.toString(),
      "The recipient's token balance should match the transferred amount."
    );
  });

  it("Initializes the contract correctly", async () => {
    const description = "US Elections";
    const optionNames = ["donald", "kamla"];
    const initialPool = [new BN(500), new BN(700)]; 
    const admin = wallet.publicKey;
    const tokenAccountAddress = contractTokenAccount.address;
     
    const tx = await program.methods.new(description, optionNames, initialPool, admin, tokenAccountAddress ,wallet.publicKey)
    .accounts({ dataAccount: dataAccount.publicKey})
    .signers([dataAccount])
    .rpc();
    console.log("Initialization transaction signature:", tx);
    
    // Verify the initial state
    const contractOptions = await program.methods.getDetails()
    .accounts({ dataAccount: dataAccount.publicKey })
    .view();
    console.log(contractOptions)
    console.log(contractOptions[0].price.toString())
    
    // console.log(contractTokenAccount.address)

    // await program.methods.updateContractTokenAccount(contractTokenAccount.address)
    // .accounts({ dataAccount: dataAccount.publicKey })
    // // .signers([dataAccount])
    // .rpc();


    expect(contractOptions[0].name).to.equal(optionNames[0]);  // Check 'donald'
    expect(contractOptions[1].name).to.equal(optionNames[1]);  // Check 'kamla'

    const programId = program.programId;
    console.log("Program ID:", programId.toString());

  });

  // it("Can buy shares correctly", async () => { 
  //   const optionIndex = new BN(0); // Let's buy shares for "donald" 
  //   const betAmount = new BN(500); // Betting 500 units 
  //   const caller = wallet.publicKey;
  //   const signer = wallet.publicKey;

  //   const contractOptionsBefore = await program.methods.getDetails()
  //   .accounts({ dataAccount: dataAccount.publicKey })
  //   .view();
  //   console.log("Contract options before buy:", contractOptionsBefore);

  //   // Call the 'buy' function to place the bet
  //   const txBuy = await program.methods.buy(optionIndex, betAmount, caller, signer)
  //     .accounts({ dataAccount: dataAccount.publicKey })
  //     .rpc();
  //   console.log("Buy shares transaction signature:", txBuy);

  //   // Fetch and verify the contract details after the buy
  //   const contractOptionsAfter = await program.methods.getDetails()
  //     .accounts({ dataAccount: dataAccount.publicKey })
  //     .view();
  //   console.log("Contract options after buy:", contractOptionsAfter);

  //   // Ensure the pool for the chosen option has increased
  //   expect(contractOptionsAfter[optionIndex.toNumber()].pool.toString()).to.equal((contractOptionsBefore[optionIndex.toNumber()].pool.toNumber()+betAmount.toNumber()).toString());
  // });


  // it("user shares working correctly", async () => { 
  //   const optionIndex = new BN(0)
  //   const caller = wallet.publicKey
  //   const userShares = await program.methods.getUserShares(caller, optionIndex)
  //     .accounts({ dataAccount: dataAccount.publicKey })
  //     .view();
  //   console.log("User shares after buy:", userShares.toNumber());

  //   expect(userShares.toString()).to.not.equal("0"); 
  // });

  // it("Can sell shares correctly", async () => {
  //   const optionIndex = new BN(0); // Selling shares for "donald"
  //   const sellAmount = new BN(100); // Selling 100 shares
  //   const caller = wallet.publicKey;

  //   // Fetch user shares before selling
  //   const userSharesBefore = await program.methods.getUserShares(caller, optionIndex)
  //     .accounts({ dataAccount: dataAccount.publicKey })
  //     .view();
  //   console.log("User shares before sell:", userSharesBefore.toNumber());

  //   // Fetch contract details before selling to check the pool values
  //   const contractOptionsBefore = await program.methods.getDetails()
  //     .accounts({ dataAccount: dataAccount.publicKey })
  //     .view();
  //   console.log("Contract options before sell:", contractOptionsBefore);

  //   // Step 2: Call the 'sell' function to sell shares
  //   const txSell = await program.methods.sell(optionIndex, sellAmount, caller)
  //     .accounts({ dataAccount: dataAccount.publicKey })
  //     .rpc();
  //   console.log("Sell shares transaction signature:", txSell);

  //   // Fetch contract options after selling and verify the pool has decreased
  //   const contractOptionsAfter = await program.methods.getDetails()
  //     .accounts({ dataAccount: dataAccount.publicKey })
  //     .view();
  //   console.log("Contract options after sell:", contractOptionsAfter);

  //   // Ensure the pool for the chosen option has decreased by the correct amount
  //   // const expectedPoolAfterSell = contractOptionsBefore[optionIndex.toNumber()].pool.toNumber() - sellAmount.toNumber();
  //   // expect(contractOptionsAfter[optionIndex.toNumber()].pool.toString()).to.equal(expectedPoolAfterSell.toString());

  //   // Verify the total pool has been updated
  //   // const totalPoolAfter = contractOptionsAft  er.reduce((sum, option) => sum + option.pool.toNumber(), 0);
  //   // expect(totalPoolAfter).to.equal(
  //     // contractOptionsBefore.reduce((sum, option) => sum + option.pool.toNumber(), 0) - sellAmount.toNumber()
  //   // );

  //   // Step 3: Check the user's shares after the sell
  //   const userSharesAfter = await program.methods.getUserShares(caller, optionIndex)
  //     .accounts({ dataAccount: dataAccount.publicKey })
  //     .view();
  //   console.log("User shares after sell:", userSharesAfter.toNumber());

  //   // Ensure that the user's shares for the selected option have been reduced correctly
  //   expect(userSharesAfter.toString()).to.equal((
  //     userSharesBefore.toNumber() - sellAmount.toNumber()).toString() // Shares should decrease by the sell amount
  //   );
  // });

  
  it("Buy function transfers tokens correctly", async () => {
    const optionIndex = new BN(0); // Option index for "donald"
    const betAmount = new BN(100); // Betting 100 tokens
    const user = anchor.web3.Keypair.fromSecretKey(new Uint8Array([135,122,83,187,44,240,189,51,201,3,178,130,195,176,191,64,94,248,224,180,73,31,163,60,58,157,203,70,60,49,81,64,73,232,158,30,134,173,157,125,92,127,133,173,236,139,226,50,60,27,174,103,153,83,35,157,167,59,174,203,176,203,12,124]));
    console.log("user", user.publicKey.toBase58());
  
    // Create associated token account for the user
    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer, // payer
      mintKeypair.publicKey, // mint
      user.publicKey // owner
    );
    console.log("User Token Account:", userTokenAccount.address.toString());
  
    // Mint tokens to the user's token account
    const mintAmount = new anchor.BN(500); // Mint 500 tokens
    await splProgram.methods
      .mintTo(mintAmount)
      .accounts({
        mintAuthority: wallet.publicKey,
        tokenAccount: userTokenAccount.address,
        mint: mintKeypair.publicKey,
      })
      .rpc({ skipPreflight: true });
    console.log(`Minted ${mintAmount.toString()} tokens to user account`);
  
    // Verify initial user token balance
    const userTokenAccountBefore = await getAccount(connection, userTokenAccount.address);
    console.log("User token balance before buy:", userTokenAccountBefore.amount);
  
    // Fetch initial contract token account balance
    const contractTokenAccountDataBefore = await getAccount(connection, contractTokenAccount.address);
    console.log("Contract token balance before buy:", contractTokenAccountDataBefore.amount.toString());
      
    const userAccount = userTokenAccount.address;
    const userSignature = user.publicKey; 
    // Call the buy function
    const txBuy = await program.methods
      .buy(optionIndex, betAmount, userAccount, userSignature)
      .accounts({
        dataAccount: dataAccount.publicKey,
        spl_token_minter_programId: splProgram.programId,
      })
      // .signers([user])
      .rpc({ skipPreflight: true });
    console.log("Buy transaction signature:", txBuy);
  
    // Verify user token balance after the buy
    const userTokenAccountAfter = await getAccount(connection, userTokenAccount.address);
    console.log("User token balance after buy:", userTokenAccountAfter.amount.toString());
    // assert.equal(
    //   userTokenAccountAfter.amount.toString(),
    //   (userTokenAccountBefore.amount - betAmount.toNumber()).toString(),
    //   "User's token balance should decrease by the bet amount"
    // );
  
    // Verify contract token balance after the buy
    const contractTokenAccountDataAfter = await getAccount(connection, contractTokenAccount.address);
    console.log("Contract token balance after buy:", contractTokenAccountDataAfter.amount.toString());
    // assert.equal(
    //   contractTokenAccountDataAfter.amount.toString(),
    //   (contractTokenAccountDataBefore.amount + betAmount.toNumber()).toString(),
    //   "Contract's token balance should increase by the bet amount"
    // );
  
    // // Verify option pool and total pool updates
    // const contractOptions = await program.methods.getDetails()
    //   .accounts({ dataAccount: dataAccount.publicKey })
    //   .view();
    // console.log("Option pool after buy:", contractOptions[optionIndex.toNumber()].pool.toString());
    // expect(contractOptions[optionIndex.toNumber()].pool.toString()).to.equal(betAmount.toString());
  });
  
});
