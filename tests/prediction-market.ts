import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PredictionMarket } from "../target/types/prediction_market";
import { BN } from "@coral-xyz/anchor";
import { expect } from "chai";
import { SplTokenMinter } from "../target/types/spl_token_minter";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Metaplex } from "@metaplex-foundation/js";
import { assert } from "chai";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
  getAccount
} from "@solana/spl-token";
import { WalletConfigError } from "@solana/wallet-adapter-base";

describe("prediction-market", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const dataAccount = anchor.web3.Keypair.generate();
  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;

  const program = anchor.workspace.PredictionMarket as Program<PredictionMarket>;
  const splProgram = anchor.workspace.SplTokenMinter as Program<SplTokenMinter>;

  const tokenTitle = "BullsUSDC";
  const tokenSymbol = "KING";
  const tokenUri =
    "https://res.cloudinary.com/ddwkxn8ak/image/upload/v1698823073/solangsol/Course1_mhz1c1.png";

  let contractTokenAccount;

  it("Initializes the contract correctly", async () => {
    const description = "US Elections";
    const optionNames = ["donald", "kamla"];
    const initialPool = [new BN(500), new BN(700)]; 
    const admin = wallet.publicKey;
    const tx = await program.methods.new(description, optionNames, initialPool, admin, wallet.publicKey)
    .accounts({ dataAccount: dataAccount.publicKey })
    .signers([dataAccount])
    .rpc();
    console.log("Initialization transaction signature:", tx);

    // Verify the initial state
    const contractOptions = await program.methods.getDetails()
    .accounts({ dataAccount: dataAccount.publicKey })
    .view();
    console.log(contractOptions)
    console.log(contractOptions[0].price.toString())

    expect(contractOptions[0].name).to.equal(optionNames[0]);  // Check 'donald'
    expect(contractOptions[1].name).to.equal(optionNames[1]);  // Check 'kamla'

    const programId = program.programId;
    console.log("Program ID:", programId.toString());

     contractTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer, // payer
      mintKeypair.publicKey, // mint
      wallet.publicKey // owner
    );

  });

  it("Can buy shares correctly", async () => { 
    const optionIndex = new BN(0); // Let's buy shares for "donald" 
    const betAmount = new BN(500); // Betting 500 units 
    const caller = wallet.publicKey;

    const contractOptionsBefore = await program.methods.getDetails()
    .accounts({ dataAccount: dataAccount.publicKey })
    .view();
    console.log("Contract options before buy:", contractOptionsBefore);

    // Call the 'buy' function to place the bet
    const txBuy = await program.methods.buy(optionIndex, betAmount, caller)
      .accounts({ dataAccount: dataAccount.publicKey })
      .rpc();
    console.log("Buy shares transaction signature:", txBuy);

    // Fetch and verify the contract details after the buy
    const contractOptionsAfter = await program.methods.getDetails()
      .accounts({ dataAccount: dataAccount.publicKey })
      .view();
    console.log("Contract options after buy:", contractOptionsAfter);

    // Ensure the pool for the chosen option has increased
    expect(contractOptionsAfter[optionIndex.toNumber()].pool.toString()).to.equal((contractOptionsBefore[optionIndex.toNumber()].pool.toNumber()+betAmount.toNumber()).toString());
  });


  it("user shares working correctly", async () => { 
    const optionIndex = new BN(0)
    const caller = wallet.publicKey
    const userShares = await program.methods.getUserShares(caller, optionIndex)
      .accounts({ dataAccount: dataAccount.publicKey })
      .view();
    console.log("User shares after buy:", userShares.toNumber());

    expect(userShares.toString()).to.not.equal("0"); 
  });

  it("Can sell shares correctly", async () => {
    const optionIndex = new BN(0); // Selling shares for "donald"
    const sellAmount = new BN(100); // Selling 100 shares
    const caller = wallet.publicKey;

    // Fetch user shares before selling
    const userSharesBefore = await program.methods.getUserShares(caller, optionIndex)
      .accounts({ dataAccount: dataAccount.publicKey })
      .view();
    console.log("User shares before sell:", userSharesBefore.toNumber());

    // Fetch contract details before selling to check the pool values
    const contractOptionsBefore = await program.methods.getDetails()
      .accounts({ dataAccount: dataAccount.publicKey })
      .view();
    console.log("Contract options before sell:", contractOptionsBefore);

    // Step 2: Call the 'sell' function to sell shares
    const txSell = await program.methods.sell(optionIndex, sellAmount, caller)
      .accounts({ dataAccount: dataAccount.publicKey })
      .rpc();
    console.log("Sell shares transaction signature:", txSell);

    // Fetch contract options after selling and verify the pool has decreased
    const contractOptionsAfter = await program.methods.getDetails()
      .accounts({ dataAccount: dataAccount.publicKey })
      .view();
    console.log("Contract options after sell:", contractOptionsAfter);

    // Ensure the pool for the chosen option has decreased by the correct amount
    // const expectedPoolAfterSell = contractOptionsBefore[optionIndex.toNumber()].pool.toNumber() - sellAmount.toNumber();
    // expect(contractOptionsAfter[optionIndex.toNumber()].pool.toString()).to.equal(expectedPoolAfterSell.toString());

    // Verify the total pool has been updated
    // const totalPoolAfter = contractOptionsAft  er.reduce((sum, option) => sum + option.pool.toNumber(), 0);
    // expect(totalPoolAfter).to.equal(
      // contractOptionsBefore.reduce((sum, option) => sum + option.pool.toNumber(), 0) - sellAmount.toNumber()
    // );

    // Step 3: Check the user's shares after the sell
    const userSharesAfter = await program.methods.getUserShares(caller, optionIndex)
      .accounts({ dataAccount: dataAccount.publicKey })
      .view();
    console.log("User shares after sell:", userSharesAfter.toNumber());

    // Ensure that the user's shares for the selected option have been reduced correctly
    expect(userSharesAfter.toString()).to.equal((
      userSharesBefore.toNumber() - sellAmount.toNumber()).toString() // Shares should decrease by the sell amount
    );
  });

});
